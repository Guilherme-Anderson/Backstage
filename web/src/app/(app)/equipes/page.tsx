import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui";
import { NewTeamForm } from "./new-team-form";

export const dynamic = "force-dynamic";

export default async function EquipesPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select(
      "id, name, description, active, team_members(id, is_coordinator, active), roles(id, active)",
    )
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Equipes</h1>
        <p className="text-sm text-fg-muted">
          {session.isAdmin
            ? "Todas as subequipes da Backstage."
            : "Você gerencia apenas as equipes onde é coordenador."}
        </p>
      </div>

      <Card>
        <CardHeader title="Subequipes" />
        {!teams || teams.length === 0 ? (
          <EmptyState>Nenhuma equipe cadastrada.</EmptyState>
        ) : (
          <ul className="divide-y divide-border-soft">
            {teams.map((t) => {
              const members = (t.team_members ?? []).filter((m) => m.active);
              const canManage =
                session.isAdmin ||
                session.coordinatorTeamIds.includes(t.id);
              return (
                <li key={t.id}>
                  <Link
                    href={`/equipes/${t.id}`}
                    className="flex flex-col gap-1 px-5 py-3 hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-fg">
                        <span>{t.name}</span>
                        {!t.active ? <Badge>Inativa</Badge> : null}
                        {canManage ? (
                          <Badge tone="sky">Você coordena</Badge>
                        ) : null}
                      </div>
                      <div className="text-sm text-fg-muted">
                        {t.description || "—"}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm text-fg-muted sm:text-right">
                      {members.length} pessoa(s) ·{" "}
                      {(t.roles ?? []).filter((r) => r.active).length} função(ões)
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {session.isAdmin ? (
        <Card className="p-5">
          <h2 className="mb-3 text-base font-semibold text-fg">
            Nova equipe
          </h2>
          <NewTeamForm />
        </Card>
      ) : null}
    </div>
  );
}
