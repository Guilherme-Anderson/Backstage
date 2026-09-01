# Supabase — projeto `backstage`

- **Project ref:** `fetrngpniecxwdmjgwkv`
- **Região:** `sa-east-1`
- **URL:** `https://fetrngpniecxwdmjgwkv.supabase.co`

## Migrations

As migrations em `migrations/` **já foram aplicadas** ao projeto remoto (via MCP,
em 2026-09-01). Elas estão aqui para versionamento e para recriar o banco do zero.

Para trabalhar com a CLI localmente:

```bash
npm i -g supabase
supabase login
supabase link --project-ref fetrngpniecxwdmjgwkv
supabase db pull            # confere que o remoto bate com migrations/
# ou, num projeto novo:
supabase db push
```

Ordem das migrations:

| Arquivo | O que faz |
|---|---|
| `0001_enums_and_tables` | enums, tabelas, índices |
| `0002_functions_and_triggers` | helpers de RLS, RPCs (`generate_recurring_events`, `open_availability_cycle`, `submit_availability`, `confirm_assignment`, …), triggers |
| `0003_rls_policies` | RLS em todas as tabelas |
| `0004_seed` | 5 equipes, 3 recorrências, 1 função por equipe, admin inicial, alvos de WhatsApp, settings |
| `0005_harden_function_grants` | tranca `EXECUTE` das funções; adiciona `set_event_teams` |
| `0006_invite_only_signup_gate` | cadastro só para e-mails pré-autorizados por um admin |

## Configuração de Auth (fazer no painel)

Em **Authentication → URL Configuration**:

- **Site URL:** a URL de produção da Vercel (ex.: `https://backstage.vercel.app`)
- **Redirect URLs:** adicionar
  - `http://localhost:3000/auth/callback`
  - `https://SEU-APP.vercel.app/auth/callback`

Em **Authentication → Providers → Email**: manter **Email** ligado. Para onboarding
mais suave, considere **desligar "Confirm email"** — o cadastro já é restrito por
convite (migration 0006), então a confirmação por e-mail é opcional.

## Como o primeiro admin entra

1. A migration 0004 já cadastrou `acesgptgg@gmail.com` como `admin_geral`.
2. Acesse `/criar-acesso`, informe esse e-mail e defina uma senha.
3. O trigger `on_auth_user_created` vincula a conta automaticamente.
4. Dentro do app, em **Configurações**, cadastre o 2º admin e os coordenadores.

## Leva 2 (bot + cron)

- `functions/` receberá as Edge Functions (`request-availability`,
  `weekly-reminders`, `event-summary`).
- `pg_cron` + `pg_net` dispararão essas funções. As tabelas `whatsapp_outbox`,
  `whatsapp_inbox` e `whatsapp_targets` já existem.
- A `service_role key` (Project Settings → API) só é necessária a partir daí.
