import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/constants";
import { AddAccessForm } from "./add-access-form";
import { WhatsAppTargetForm } from "./whatsapp-target-form";
import { GeneralSettingsForm } from "./general-settings-form";

export const dynamic = "force-dynamic";

type SettingRow = { key: string; value: unknown };

function readBool(rows: SettingRow[], key: string, dflt = true): boolean {
  const r = rows.find((x) => x.key === key);
  return r ? Boolean(r.value) : dflt;
}
function readStr(rows: SettingRow[], key: string): string {
  const r = rows.find((x) => x.key === key);
  return typeof r?.value === "string" ? r.value : "";
}

export default async function ConfigPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: accessUsers }, { data: targets }, { data: settings }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, email, role, auth_user_id, active")
        .in("role", ["admin_geral", "coordenador"])
        .order("role", { ascending: true })
        .order("full_name", { ascending: true }),
      supabase
        .from("whatsapp_targets")
        .select("id, kind, label, chat_id, active, teams(name)")
        .order("kind", { ascending: true }),
      supabase.from("app_settings").select("key, value"),
    ]);
  const s = (settings ?? []) as SettingRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Configurações</h1>
        <p className="text-sm text-fg-muted">Somente administradores.</p>
      </div>

      <Card>
        <CardHeader
          title="Acessos ao app"
          description="Administradores e coordenadores. Novos usuários definem a senha em “Primeiro acesso”."
        />
        {!accessUsers || accessUsers.length === 0 ? (
          <EmptyState>Nenhum acesso cadastrado.</EmptyState>
        ) : (
          <ul className="divide-y divide-border-soft">
            {accessUsers.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div>
                  <div className="font-medium text-fg">
                    {u.full_name}
                    <Badge
                      tone={u.role === "admin_geral" ? "sky" : "neutral"}
                      className="ml-2"
                    >
                      {ROLE_LABEL[u.role]}
                    </Badge>
                  </div>
                  <div className="text-sm text-fg-muted">{u.email}</div>
                </div>
                <Badge tone={u.auth_user_id ? "green" : "amber"}>
                  {u.auth_user_id ? "Ativo" : "Aguardando 1º acesso"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-border-soft p-5">
          <AddAccessForm />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Grupos de WhatsApp"
          description="O ID do grupo é usado pelo bot (leva 2). Preencha quando o bot estiver pareado."
        />
        <div className="divide-y divide-border-soft">
          {(targets ?? []).map((t) => (
            <div key={t.id} className="px-5 py-4">
              <WhatsAppTargetForm
                target={{
                  id: t.id,
                  label: t.label,
                  chat_id: t.chat_id,
                  active: t.active,
                  hint:
                    t.kind === "leadership"
                      ? "Liderança"
                      : t.teams?.name ?? "Equipe",
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold text-fg">
          Configurações gerais
        </h2>
        <GeneralSettingsForm
          values={{
            public_base_url: readStr(s, "public_base_url"),
            cron_request_availability_enabled: readBool(
              s,
              "cron_request_availability_enabled",
            ),
            cron_weekly_reminders_enabled: readBool(
              s,
              "cron_weekly_reminders_enabled",
            ),
            cron_event_summary_enabled: readBool(s, "cron_event_summary_enabled"),
          }}
        />
      </Card>
    </div>
  );
}
