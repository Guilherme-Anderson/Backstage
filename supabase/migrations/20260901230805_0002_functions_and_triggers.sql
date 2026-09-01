-- ============================================================
-- Backstage — funções auxiliares, RPCs públicas e triggers
-- ============================================================

-- ---------- Helpers de identidade / permissão ----------
create or replace function public.current_app_user_id()
returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select id from public.users where auth_user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users
    where auth_user_id = auth.uid() and active and role = 'admin_geral'
  );
$$;

create or replace function public.has_app_login()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users
    where auth_user_id = auth.uid() and active and role in ('admin_geral', 'coordenador')
  );
$$;

create or replace function public.is_any_coordinator()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users
    where auth_user_id = auth.uid() and active and role in ('admin_geral', 'coordenador')
  );
$$;

create or replace function public.is_coordinator_of(p_team_id uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select public.is_admin() or exists (
    select 1
    from public.team_members tm
    join public.users u on u.id = tm.user_id
    where u.auth_user_id = auth.uid()
      and u.active
      and tm.team_id = p_team_id
      and tm.is_coordinator
      and tm.active
  );
$$;

-- ---------- Trigger: manter updated_at ----------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger event_info_updated_at
  before update on public.event_info
  for each row execute function public.tg_set_updated_at();

-- ---------- Trigger: consistência equipe x evento em assignments ----------
create or replace function public.tg_assignment_event_team()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if not exists (
    select 1 from public.event_teams et
    where et.event_id = new.event_id and et.team_id = new.team_id
  ) then
    raise exception 'A equipe % não participa do evento %', new.team_id, new.event_id;
  end if;
  return new;
end;
$$;

create trigger assignments_event_team_check
  before insert or update on public.assignments
  for each row execute function public.tg_assignment_event_team();

-- ---------- Trigger: sincronizar status da escala com user_id ----------
create or replace function public.tg_assignment_status_sync()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();

  if new.user_id is null then
    new.status := 'unfilled';
    new.confirmed_at := null;
    new.declined_at := null;
    new.reminded_at := null;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status = 'unfilled' then
      new.status := 'pending';
    end if;
    return new;
  end if;

  -- UPDATE com pessoa definida: se trocou de pessoa, reinicia confirmação
  if new.user_id is distinct from old.user_id then
    new.status := 'pending';
    new.confirmed_at := null;
    new.declined_at := null;
    new.reminded_at := null;
    new.confirm_token := gen_random_uuid();
  end if;

  return new;
end;
$$;

create trigger assignments_status_sync
  before insert or update on public.assignments
  for each row execute function public.tg_assignment_status_sync();

-- ---------- Trigger: vincular pessoa pré-cadastrada ao logar ----------
create or replace function public.tg_handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.users
     set auth_user_id = new.id
   where auth_user_id is null
     and email is not null
     and lower(email) = lower(new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_auth_user();

-- ============================================================
-- RPC: garantir vagas (assignments) de um evento
-- ============================================================
create or replace function public.sync_event_slots(p_event_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record;
begin
  for r in
    select et.team_id, ro.id as role_id
    from public.event_teams et
    join public.roles ro on ro.team_id = et.team_id and ro.active
    where et.event_id = p_event_id
  loop
    insert into public.assignments (event_id, team_id, role_id, status)
    values (p_event_id, r.team_id, r.role_id, 'unfilled')
    on conflict (event_id, role_id) do nothing;
  end loop;
end;
$$;

-- ============================================================
-- RPC: gerar cultos recorrentes de um mês
-- ============================================================
create or replace function public.generate_recurring_events(p_year int, p_month int)
returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_first date := make_date(p_year, p_month, 1);
  v_last  date := (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date;
  d date;
  tmpl record;
  ev_id uuid;
  created int := 0;
begin
  if not (public.is_admin() or public.is_any_coordinator()) then
    raise exception 'Sem permissão para gerar cultos';
  end if;

  for tmpl in select * from public.event_templates where active order by sort_order loop
    d := v_first;
    while d <= v_last loop
      if extract(dow from d)::int = tmpl.weekday then
        insert into public.events (title, event_date, start_time, kind, template_id, created_by)
        values (tmpl.name, d, tmpl.default_start_time, 'recurring', tmpl.id, public.current_app_user_id())
        on conflict (template_id, event_date) where template_id is not null do nothing
        returning id into ev_id;

        if ev_id is not null then
          created := created + 1;
          insert into public.event_teams (event_id, team_id)
          select ev_id, ett.team_id
          from public.event_template_teams ett
          where ett.event_template_id = tmpl.id
          on conflict do nothing;

          perform public.sync_event_slots(ev_id);
        end if;
        ev_id := null;
      end if;
      d := d + 1;
    end loop;
  end loop;

  return created;
end;
$$;

-- ============================================================
-- RPC: abrir ciclo mensal de disponibilidade de uma equipe
-- ============================================================
create or replace function public.open_availability_cycle(p_team_id uuid, p_year int, p_month int)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_cycle_id uuid;
  v_first date := make_date(p_year, p_month, 1);
  v_last  date := (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date;
  v_has_wed boolean;
  v_has_sun boolean;
  d date;
  m record;
  v_resp_id uuid;
begin
  if not (public.is_admin() or public.is_coordinator_of(p_team_id)) then
    raise exception 'Sem permissão para abrir ciclo desta equipe';
  end if;

  v_has_wed := exists (
    select 1 from public.event_templates et
    join public.event_template_teams ett on ett.event_template_id = et.id
    where ett.team_id = p_team_id and et.active and et.weekday = 3
  );
  v_has_sun := exists (
    select 1 from public.event_templates et
    join public.event_template_teams ett on ett.event_template_id = et.id
    where ett.team_id = p_team_id and et.active and et.weekday = 0
  );

  insert into public.availability_cycles (team_id, year, month, status, created_by)
  values (p_team_id, p_year, p_month, 'open', public.current_app_user_id())
  on conflict (team_id, year, month) do update set status = 'open'
  returning id into v_cycle_id;

  for m in
    select tm.user_id
    from public.team_members tm
    join public.users u on u.id = tm.user_id
    where tm.team_id = p_team_id and tm.active and u.active
  loop
    insert into public.availability_responses (cycle_id, user_id)
    values (v_cycle_id, m.user_id)
    on conflict (cycle_id, user_id) do nothing
    returning id into v_resp_id;

    if v_resp_id is not null then
      d := v_first;
      while d <= v_last loop
        if v_has_wed and extract(dow from d)::int = 3 then
          insert into public.availability_dates (response_id, service_date, block, available)
          values (v_resp_id, d, 'wednesday', false)
          on conflict (response_id, service_date, block) do nothing;
        elsif v_has_sun and extract(dow from d)::int = 0 then
          insert into public.availability_dates (response_id, service_date, block, available)
          values (v_resp_id, d, 'sunday', false)
          on conflict (response_id, service_date, block) do nothing;
        end if;
        d := d + 1;
      end loop;
    end if;
    v_resp_id := null;
  end loop;

  return v_cycle_id;
end;
$$;

-- ============================================================
-- RPCs públicas (chamáveis por anon via token)
-- ============================================================
create or replace function public.get_availability_form(p_token uuid)
returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'response_id', r.id,
    'submitted_at', r.submitted_at,
    'person', jsonb_build_object('full_name', u.full_name),
    'team', jsonb_build_object('name', t.name),
    'cycle', jsonb_build_object('year', c.year, 'month', c.month, 'status', c.status, 'closes_at', c.closes_at),
    'dates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'service_date', ad.service_date, 'block', ad.block, 'available', ad.available
      ) order by ad.service_date)
      from public.availability_dates ad where ad.response_id = r.id
    ), '[]'::jsonb)
  )
  from public.availability_responses r
  join public.availability_cycles c on c.id = r.cycle_id
  join public.users u on u.id = r.user_id
  join public.teams t on t.id = c.team_id
  where r.token = p_token;
$$;

create or replace function public.submit_availability(p_token uuid, p_dates jsonb)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  resp record;
  cyc  record;
  item jsonb;
begin
  select * into resp from public.availability_responses where token = p_token;
  if not found then
    raise exception 'Link inválido';
  end if;

  select * into cyc from public.availability_cycles where id = resp.cycle_id;
  if cyc.status <> 'open' then
    raise exception 'O período para informar disponibilidade já foi encerrado';
  end if;

  for item in select * from jsonb_array_elements(p_dates) loop
    insert into public.availability_dates (response_id, service_date, block, available)
    values (
      resp.id,
      (item->>'service_date')::date,
      (item->>'block')::public.service_block,
      coalesce((item->>'available')::boolean, false)
    )
    on conflict (response_id, service_date, block)
    do update set available = excluded.available;
  end loop;

  update public.availability_responses set submitted_at = now() where id = resp.id;
end;
$$;

create or replace function public.get_confirm_info(p_token uuid)
returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'assignment_id', a.id,
    'status', a.status,
    'person', u.full_name,
    'team', t.name,
    'role', ro.name,
    'event', jsonb_build_object(
      'title', e.title,
      'event_date', e.event_date,
      'start_time', e.start_time
    )
  )
  from public.assignments a
  join public.events e on e.id = a.event_id
  join public.teams t on t.id = a.team_id
  join public.roles ro on ro.id = a.role_id
  left join public.users u on u.id = a.user_id
  where a.confirm_token = p_token;
$$;

create or replace function public.confirm_assignment(p_token uuid, p_confirm boolean, p_reason text default null)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a record;
begin
  select * into a from public.assignments where confirm_token = p_token;
  if not found then
    raise exception 'Link inválido';
  end if;
  if a.user_id is null then
    raise exception 'Esta vaga ainda não tem pessoa escalada';
  end if;

  if p_confirm then
    update public.assignments
       set status = 'confirmed', confirmed_at = now(), declined_at = null
     where id = a.id;
  else
    update public.assignments
       set status = 'declined', declined_at = now(), confirmed_at = null
     where id = a.id;

    insert into public.swap_requests (assignment_id, requested_by, reason, status)
    values (a.id, a.user_id, p_reason, 'open');
  end if;
end;
$$;

-- ---------- Grants para as RPCs públicas ----------
revoke execute on function public.get_availability_form(uuid) from public;
revoke execute on function public.submit_availability(uuid, jsonb) from public;
revoke execute on function public.get_confirm_info(uuid) from public;
revoke execute on function public.confirm_assignment(uuid, boolean, text) from public;
grant execute on function public.get_availability_form(uuid) to anon, authenticated;
grant execute on function public.submit_availability(uuid, jsonb) to anon, authenticated;
grant execute on function public.get_confirm_info(uuid) to anon, authenticated;
grant execute on function public.confirm_assignment(uuid, boolean, text) to anon, authenticated;
