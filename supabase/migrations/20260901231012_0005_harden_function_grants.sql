-- ============================================================
-- Backstage — endurecer grants das funções (resposta ao linter)
-- ============================================================

-- 1) search_path fixo no trigger que faltou
alter function public.tg_set_updated_at() set search_path = public, pg_temp;

-- 2) Helpers de permissão: necessários para o RLS (authenticated),
--    mas não devem ser chamáveis por anon via REST.
revoke execute on function public.current_app_user_id()      from public, anon;
revoke execute on function public.is_admin()                 from public, anon;
revoke execute on function public.has_app_login()            from public, anon;
revoke execute on function public.is_any_coordinator()       from public, anon;
revoke execute on function public.is_coordinator_of(uuid)    from public, anon;
grant  execute on function public.current_app_user_id()      to authenticated, service_role;
grant  execute on function public.is_admin()                 to authenticated, service_role;
grant  execute on function public.has_app_login()            to authenticated, service_role;
grant  execute on function public.is_any_coordinator()       to authenticated, service_role;
grant  execute on function public.is_coordinator_of(uuid)    to authenticated, service_role;

-- 3) Funções internas / triggers: sem acesso REST algum
revoke execute on function public.sync_event_slots(uuid)          from public, anon, authenticated;
revoke execute on function public.tg_handle_new_auth_user()       from public, anon, authenticated;
revoke execute on function public.tg_set_updated_at()             from public, anon, authenticated;
revoke execute on function public.tg_assignment_event_team()      from public, anon, authenticated;
revoke execute on function public.tg_assignment_status_sync()     from public, anon, authenticated;
grant  execute on function public.sync_event_slots(uuid)          to service_role;

-- 4) RPCs de coordenador/admin: só logados (checagem interna de papel), nunca anon
revoke execute on function public.generate_recurring_events(int, int)         from public, anon;
revoke execute on function public.open_availability_cycle(uuid, int, int)     from public, anon;
grant  execute on function public.generate_recurring_events(int, int)         to authenticated, service_role;
grant  execute on function public.open_availability_cycle(uuid, int, int)     to authenticated, service_role;

-- 5) RPCs públicas por token: mantêm anon (protegidas por UUID não-adivinhável)
grant  execute on function public.get_availability_form(uuid)                 to service_role;
grant  execute on function public.submit_availability(uuid, jsonb)            to service_role;
grant  execute on function public.get_confirm_info(uuid)                      to service_role;
grant  execute on function public.confirm_assignment(uuid, boolean, text)     to service_role;

-- 6) Wrapper para definir as equipes de um evento (usa sync_event_slots internamente)
create or replace function public.set_event_teams(p_event_id uuid, p_team_ids uuid[])
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not (public.is_admin() or public.is_any_coordinator()) then
    raise exception 'Sem permissão para editar as equipes do evento';
  end if;

  -- remove escalas e vínculos de equipes que saíram
  delete from public.assignments
   where event_id = p_event_id
     and team_id <> all (coalesce(p_team_ids, '{}'::uuid[]));
  delete from public.event_teams
   where event_id = p_event_id
     and team_id <> all (coalesce(p_team_ids, '{}'::uuid[]));

  -- adiciona as novas
  insert into public.event_teams (event_id, team_id)
  select p_event_id, x from unnest(coalesce(p_team_ids, '{}'::uuid[])) as x
  on conflict do nothing;

  perform public.sync_event_slots(p_event_id);
end;
$$;
revoke execute on function public.set_event_teams(uuid, uuid[]) from public, anon;
grant  execute on function public.set_event_teams(uuid, uuid[]) to authenticated, service_role;
