-- ============================================================
-- Backstage — seed inicial
-- ============================================================

-- Equipes (Iluminação entra depois como nova linha)
insert into public.teams (key, name, description, sort_order) values
  ('video',       'Vídeo',       'Operação da tela de LED',                1),
  ('redacao',     'Redação',     'Resumo das pregações para posts',        2),
  ('audio',       'Áudio',       'Som da igreja',                          3),
  ('fotografia',  'Fotografia',  'Fotos e pequenos vídeos para posts',     4),
  ('transmissao', 'Transmissão', 'Transmissão do culto',                   5);

-- Uma função genérica por equipe (coordenador refina depois)
insert into public.roles (team_id, key, name, sort_order)
select id, 'operacao', 'Operação — ' || name, 1 from public.teams;

-- Templates de culto recorrente
-- ATENÇÃO: horários abaixo são SUPOSTOS — ajuste em Cultos › Recorrências.
insert into public.event_templates (key, name, weekday, default_start_time, sort_order) values
  ('wednesday',      'Culto de Quarta',  3, '19:30', 1),
  ('sunday_morning', 'Domingo de Manhã', 0, '09:00', 2),
  ('sunday_evening', 'Domingo à Noite',  0, '18:00', 3);

-- Quais equipes atuam em cada recorrência
insert into public.event_template_teams (event_template_id, team_id)
select t.id, te.id
from public.event_templates t
join public.teams te on te.key in ('video', 'audio')
where t.key = 'wednesday';

insert into public.event_template_teams (event_template_id, team_id)
select t.id, te.id
from public.event_templates t
join public.teams te on te.key in ('video', 'redacao', 'audio', 'transmissao')  -- todas menos fotografia
where t.key = 'sunday_morning';

insert into public.event_template_teams (event_template_id, team_id)
select t.id, te.id
from public.event_templates t
join public.teams te on te.key in ('video', 'redacao', 'audio', 'fotografia', 'transmissao')  -- todas
where t.key = 'sunday_evening';

-- Admin geral inicial: vinculado automaticamente ao primeiro login com este e-mail
insert into public.users (full_name, email, role) values
  ('Administrador Geral', 'acesgptgg@gmail.com', 'admin_geral');

-- Alvo do WhatsApp da liderança (chat_id preenchido na leva 2)
insert into public.whatsapp_targets (kind, team_id, label) values
  ('leadership', null, 'Grupo de Liderança');
insert into public.whatsapp_targets (kind, team_id, label)
select 'team', id, 'Grupo — ' || name from public.teams;

-- Configurações
insert into public.app_settings (key, value) values
  ('timezone', '"America/Sao_Paulo"'::jsonb),
  ('public_base_url', '""'::jsonb),
  ('cron_request_availability_enabled', 'true'::jsonb),
  ('cron_weekly_reminders_enabled', 'true'::jsonb),
  ('cron_event_summary_enabled', 'true'::jsonb);
