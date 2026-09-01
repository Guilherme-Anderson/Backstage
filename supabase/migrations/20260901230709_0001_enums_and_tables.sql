-- ============================================================
-- Backstage — schema base: enums + tabelas + índices
-- ============================================================

-- ---------- ENUMS ----------
create type public.app_role as enum ('admin_geral', 'coordenador', 'membro');
create type public.event_kind as enum ('recurring', 'extra');
create type public.assignment_status as enum ('unfilled', 'pending', 'confirmed', 'declined');
create type public.availability_cycle_status as enum ('open', 'closed');
create type public.service_block as enum ('wednesday', 'sunday');
create type public.swap_status as enum ('open', 'resolved', 'cancelled');
create type public.wa_target_kind as enum ('team', 'leadership');
create type public.wa_target_type as enum ('group_team', 'group_leadership', 'dm');
create type public.wa_out_status as enum ('queued', 'sent', 'failed');
create type public.wa_intent as enum ('confirm', 'decline', 'availability', 'unknown');

-- ---------- TEAMS ----------
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  name        text not null,
  description text,
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- USERS (pessoas; login opcional) ----------
create table public.users (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  phone_e164   text,
  email        text,
  role         public.app_role not null default 'membro',
  auth_user_id uuid unique references auth.users(id) on delete set null,
  active       boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now()
);
create unique index users_phone_uniq on public.users (phone_e164) where phone_e164 is not null;
create unique index users_email_uniq on public.users (lower(email)) where email is not null;

-- ---------- TEAM MEMBERS ----------
create table public.team_members (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references public.teams(id) on delete cascade,
  user_id        uuid not null references public.users(id) on delete cascade,
  is_coordinator boolean not null default false,
  active         boolean not null default true,
  joined_at      timestamptz not null default now(),
  unique (team_id, user_id)
);
create index team_members_user_idx on public.team_members (user_id);
create index team_members_team_idx on public.team_members (team_id);

-- ---------- ROLES (funções por equipe) ----------
create table public.roles (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  key        text not null,
  name       text not null,
  sort_order int not null default 0,
  active     boolean not null default true,
  unique (team_id, key),
  unique (id, team_id)
);
create index roles_team_idx on public.roles (team_id);

-- ---------- EVENT TEMPLATES (recorrências) ----------
create table public.event_templates (
  id                 uuid primary key default gen_random_uuid(),
  key                text not null unique,
  name               text not null,
  weekday            int not null check (weekday between 0 and 6),  -- 0=domingo .. 6=sábado
  default_start_time time,
  active             boolean not null default true,
  sort_order         int not null default 0
);

create table public.event_template_teams (
  event_template_id uuid not null references public.event_templates(id) on delete cascade,
  team_id           uuid not null references public.teams(id) on delete cascade,
  primary key (event_template_id, team_id)
);

-- ---------- EVENTS ----------
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  event_date  date not null,
  start_time  time,
  kind        public.event_kind not null default 'extra',
  template_id uuid references public.event_templates(id) on delete set null,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create unique index events_template_date_uniq on public.events (template_id, event_date) where template_id is not null;
create index events_date_idx on public.events (event_date);

create table public.event_teams (
  event_id uuid not null references public.events(id) on delete cascade,
  team_id  uuid not null references public.teams(id) on delete cascade,
  primary key (event_id, team_id)
);

-- ---------- ASSIGNMENTS (escala: 1 pessoa por função por evento) ----------
create table public.assignments (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  team_id       uuid not null references public.teams(id) on delete cascade,
  role_id       uuid not null,
  user_id       uuid references public.users(id) on delete set null,
  status        public.assignment_status not null default 'unfilled',
  confirmed_at  timestamptz,
  declined_at   timestamptz,
  reminded_at   timestamptz,
  confirm_token uuid not null default gen_random_uuid() unique,
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (event_id, role_id),
  foreign key (role_id, team_id) references public.roles(id, team_id) on delete cascade
);
create index assignments_event_idx on public.assignments (event_id);
create index assignments_user_idx on public.assignments (user_id);
create index assignments_team_status_idx on public.assignments (team_id, status);

-- ---------- EVENT INFO (1:1 com events) ----------
create table public.event_info (
  event_id             uuid primary key references public.events(id) on delete cascade,
  preacher             text,
  songs                text,
  groups_participations text,
  notes                text,
  service_order        text,
  updated_by           uuid references public.users(id) on delete set null,
  updated_at           timestamptz not null default now()
);

-- ---------- AVAILABILITY ----------
create table public.availability_cycles (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  year       int not null,
  month      int not null check (month between 1 and 12),
  status     public.availability_cycle_status not null default 'open',
  opened_at  timestamptz not null default now(),
  closes_at  timestamptz,
  created_by uuid references public.users(id) on delete set null,
  unique (team_id, year, month)
);

create table public.availability_responses (
  id           uuid primary key default gen_random_uuid(),
  cycle_id     uuid not null references public.availability_cycles(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  token        uuid not null default gen_random_uuid() unique,
  submitted_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (cycle_id, user_id)
);

create table public.availability_dates (
  id           uuid primary key default gen_random_uuid(),
  response_id  uuid not null references public.availability_responses(id) on delete cascade,
  service_date date not null,
  block        public.service_block not null,
  available    boolean not null default false,
  unique (response_id, service_date, block)
);
create index availability_dates_response_idx on public.availability_dates (response_id);
create index availability_dates_date_idx on public.availability_dates (service_date);

-- ---------- SWAP REQUESTS ----------
create table public.swap_requests (
  id                  uuid primary key default gen_random_uuid(),
  assignment_id       uuid not null references public.assignments(id) on delete cascade,
  requested_by        uuid references public.users(id) on delete set null,
  reason              text,
  status              public.swap_status not null default 'open',
  replacement_user_id uuid references public.users(id) on delete set null,
  resolved_by         uuid references public.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  resolved_at         timestamptz
);
create index swap_requests_assignment_idx on public.swap_requests (assignment_id);
create index swap_requests_status_idx on public.swap_requests (status);

-- ---------- WHATSAPP (usado a fundo na leva 2) ----------
create table public.whatsapp_targets (
  id       uuid primary key default gen_random_uuid(),
  kind     public.wa_target_kind not null,
  team_id  uuid references public.teams(id) on delete cascade,
  chat_id  text,
  label    text not null,
  active   boolean not null default true,
  unique nulls not distinct (kind, team_id)
);

create table public.whatsapp_outbox (
  id                   uuid primary key default gen_random_uuid(),
  target_type          public.wa_target_type not null,
  target_ref           text,
  team_id              uuid references public.teams(id) on delete set null,
  body                 text not null,
  related_event_id     uuid references public.events(id) on delete set null,
  related_assignment_id uuid references public.assignments(id) on delete set null,
  status               public.wa_out_status not null default 'queued',
  attempts             int not null default 0,
  error                text,
  created_at           timestamptz not null default now(),
  sent_at              timestamptz
);
create index whatsapp_outbox_status_idx on public.whatsapp_outbox (status, created_at);

create table public.whatsapp_inbox (
  id                    uuid primary key default gen_random_uuid(),
  from_phone            text,
  from_chat             text,
  raw_text              text,
  parsed_intent         public.wa_intent not null default 'unknown',
  related_assignment_id uuid references public.assignments(id) on delete set null,
  processed             boolean not null default false,
  received_at           timestamptz not null default now()
);

-- ---------- APP SETTINGS ----------
create table public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
