-- ============================================================
-- Backstage — RLS
-- Regra geral: quem tem login (admin/coordenador) LÊ quase tudo
-- (visão consolidada mostra todas as equipes). Escrita é restrita.
-- Membros nunca logam; formulários públicos usam RPCs SECURITY DEFINER.
-- ============================================================

alter table public.teams                  enable row level security;
alter table public.users                  enable row level security;
alter table public.team_members           enable row level security;
alter table public.roles                  enable row level security;
alter table public.event_templates        enable row level security;
alter table public.event_template_teams   enable row level security;
alter table public.events                 enable row level security;
alter table public.event_teams            enable row level security;
alter table public.assignments            enable row level security;
alter table public.event_info             enable row level security;
alter table public.availability_cycles    enable row level security;
alter table public.availability_responses enable row level security;
alter table public.availability_dates     enable row level security;
alter table public.swap_requests          enable row level security;
alter table public.whatsapp_targets       enable row level security;
alter table public.whatsapp_outbox        enable row level security;
alter table public.whatsapp_inbox         enable row level security;
alter table public.app_settings           enable row level security;

-- ---------- TEAMS ----------
create policy teams_select on public.teams for select to authenticated
  using (public.has_app_login());
create policy teams_write on public.teams for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- USERS ----------
create policy users_select on public.users for select to authenticated
  using (public.has_app_login());
create policy users_insert on public.users for insert to authenticated
  with check (
    public.is_admin()
    or (public.is_any_coordinator() and role = 'membro')
  );
create policy users_update on public.users for update to authenticated
  using (
    public.is_admin()
    or (
      role = 'membro' and exists (
        select 1 from public.team_members tm
        where tm.user_id = users.id and public.is_coordinator_of(tm.team_id)
      )
    )
  )
  with check (
    public.is_admin()
    or (
      role = 'membro' and exists (
        select 1 from public.team_members tm
        where tm.user_id = users.id and public.is_coordinator_of(tm.team_id)
      )
    )
  );
create policy users_delete on public.users for delete to authenticated
  using (public.is_admin());

-- ---------- TEAM MEMBERS ----------
create policy team_members_select on public.team_members for select to authenticated
  using (public.has_app_login());
create policy team_members_write on public.team_members for all to authenticated
  using (public.is_coordinator_of(team_id))
  with check (public.is_coordinator_of(team_id));

-- ---------- ROLES ----------
create policy roles_select on public.roles for select to authenticated
  using (public.has_app_login());
create policy roles_write on public.roles for all to authenticated
  using (public.is_coordinator_of(team_id))
  with check (public.is_coordinator_of(team_id));

-- ---------- EVENT TEMPLATES ----------
create policy event_templates_select on public.event_templates for select to authenticated
  using (public.has_app_login());
create policy event_templates_write on public.event_templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy event_template_teams_select on public.event_template_teams for select to authenticated
  using (public.has_app_login());
create policy event_template_teams_write on public.event_template_teams for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- EVENTS ----------
create policy events_select on public.events for select to authenticated
  using (public.has_app_login());
create policy events_insert on public.events for insert to authenticated
  with check (public.is_admin() or public.is_any_coordinator());
create policy events_update on public.events for update to authenticated
  using (public.is_admin() or public.is_any_coordinator())
  with check (public.is_admin() or public.is_any_coordinator());
create policy events_delete on public.events for delete to authenticated
  using (public.is_admin() or (public.is_any_coordinator() and kind = 'extra'));

-- ---------- EVENT TEAMS ----------
create policy event_teams_select on public.event_teams for select to authenticated
  using (public.has_app_login());
create policy event_teams_write on public.event_teams for all to authenticated
  using (public.is_admin() or public.is_any_coordinator())
  with check (public.is_admin() or public.is_any_coordinator());

-- ---------- ASSIGNMENTS (escala) — coordenador só a própria equipe ----------
create policy assignments_select on public.assignments for select to authenticated
  using (public.has_app_login());
create policy assignments_write on public.assignments for all to authenticated
  using (public.is_coordinator_of(team_id))
  with check (public.is_coordinator_of(team_id));

-- ---------- EVENT INFO — admin OU qualquer coordenador ----------
create policy event_info_select on public.event_info for select to authenticated
  using (public.has_app_login());
create policy event_info_insert on public.event_info for insert to authenticated
  with check (public.is_admin() or public.is_any_coordinator());
create policy event_info_update on public.event_info for update to authenticated
  using (public.is_admin() or public.is_any_coordinator())
  with check (public.is_admin() or public.is_any_coordinator());
create policy event_info_delete on public.event_info for delete to authenticated
  using (public.is_admin());

-- ---------- AVAILABILITY ----------
create policy availability_cycles_select on public.availability_cycles for select to authenticated
  using (public.has_app_login());
create policy availability_cycles_write on public.availability_cycles for all to authenticated
  using (public.is_coordinator_of(team_id))
  with check (public.is_coordinator_of(team_id));

create policy availability_responses_select on public.availability_responses for select to authenticated
  using (public.has_app_login());
create policy availability_responses_write on public.availability_responses for all to authenticated
  using (exists (
    select 1 from public.availability_cycles c
    where c.id = availability_responses.cycle_id and public.is_coordinator_of(c.team_id)
  ))
  with check (exists (
    select 1 from public.availability_cycles c
    where c.id = availability_responses.cycle_id and public.is_coordinator_of(c.team_id)
  ));

create policy availability_dates_select on public.availability_dates for select to authenticated
  using (public.has_app_login());
create policy availability_dates_write on public.availability_dates for all to authenticated
  using (exists (
    select 1
    from public.availability_responses r
    join public.availability_cycles c on c.id = r.cycle_id
    where r.id = availability_dates.response_id and public.is_coordinator_of(c.team_id)
  ))
  with check (exists (
    select 1
    from public.availability_responses r
    join public.availability_cycles c on c.id = r.cycle_id
    where r.id = availability_dates.response_id and public.is_coordinator_of(c.team_id)
  ));

-- ---------- SWAP REQUESTS ----------
create policy swap_requests_select on public.swap_requests for select to authenticated
  using (public.has_app_login());
create policy swap_requests_write on public.swap_requests for all to authenticated
  using (exists (
    select 1 from public.assignments a
    where a.id = swap_requests.assignment_id and public.is_coordinator_of(a.team_id)
  ))
  with check (exists (
    select 1 from public.assignments a
    where a.id = swap_requests.assignment_id and public.is_coordinator_of(a.team_id)
  ));

-- ---------- WHATSAPP (admin apenas via app; bot usa service role) ----------
create policy whatsapp_targets_select on public.whatsapp_targets for select to authenticated
  using (public.has_app_login());
create policy whatsapp_targets_write on public.whatsapp_targets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy whatsapp_outbox_admin on public.whatsapp_outbox for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy whatsapp_inbox_admin on public.whatsapp_inbox for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- APP SETTINGS ----------
create policy app_settings_select on public.app_settings for select to authenticated
  using (public.has_app_login());
create policy app_settings_write on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
