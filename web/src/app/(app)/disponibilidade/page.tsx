import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui";
import { monthLabel, nextMonth, currentYearMonth } from "@/lib/dates";
import { OpenCycleForm } from "./open-cycle-form";

export const dynamic = "force-dynamic";

export default async function DisponibilidadePage() {
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: cycles }, { data: myTeams }] = await Promise.all([
    supabase
      .from("availability_cycles")
      .select(
        "id, year, month, status, team_id, teams(name), availability_responses(id, submitted_at)",
      )
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase
      .from("teams")
      .select("id, name")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const manageableTeams = (myTeams ?? []).filter(
    (t) => session.isAdmin || session.coordinatorTeamIds.includes(t.id),
  );

  const nm = nextMonth();
  const cm = currentYearMonth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Disponibilidade</h1>
        <p className="text-sm text-fg-muted">
          Abra o ciclo mensal e acompanhe quem já respondeu.
        </p>
      </div>

      {manageableTeams.length > 0 ? (
        <Card className="p-5">
          <h2 className="mb-3 text-base font-semibold text-fg">
            Abrir ciclo mensal
          </h2>
          <OpenCycleForm
            teams={manageableTeams}
            months={[
              { year: nm.year, month: nm.month, label: monthLabel(nm.year, nm.month) },
              { year: cm.year, month: cm.month, label: monthLabel(cm.year, cm.month) },
            ]}
          />
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Ciclos" />
        {!cycles || cycles.length === 0 ? (
          <EmptyState>Nenhum ciclo aberto ainda.</EmptyState>
        ) : (
          <ul className="divide-y divide-border-soft">
            {cycles.map((c) => {
              const responses = c.availability_responses ?? [];
              const answered = responses.filter((r) => r.submitted_at).length;
              return (
                <li key={c.id}>
                  <Link
                    href={`/disponibilidade/ciclo/${c.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2"
                  >
                    <div>
                      <div className="font-medium text-fg capitalize">
                        {c.teams?.name} — {monthLabel(c.year, c.month)}
                      </div>
                      <div className="text-sm text-fg-muted">
                        {answered}/{responses.length} responderam
                      </div>
                    </div>
                    <Badge tone={c.status === "open" ? "green" : "neutral"}>
                      {c.status === "open" ? "Aberto" : "Fechado"}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
