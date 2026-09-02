import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge, EmptyState, ButtonLink } from "@/components/ui";
import { formatShort, formatTime, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const today = todayISO();

  const [{ data: events }, { data: openSwaps }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, title, event_date, start_time, kind, event_teams(team_id), assignments(status, team_id)",
      )
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(12),
    supabase
      .from("swap_requests")
      .select(
        "id, reason, created_at, assignments(id, team_id, event_id, events(title, event_date), roles(name), person:users!assignments_user_id_fkey(full_name))",
      )
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ]);

  const myTeams = session.coordinatorTeamIds;
  const relevantSwaps = (openSwaps ?? []).filter(
    (s) =>
      session.isAdmin ||
      (s.assignments && myTeams.includes(s.assignments.team_id)),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Painel</h1>
          <p className="text-sm text-fg-muted">
            {session.isAdmin
              ? "Visão geral de todas as equipes."
              : "Visão geral das suas equipes."}
          </p>
        </div>
        <ButtonLink href="/cultos" variant="secondary" size="sm">
          Ver cultos
        </ButtonLink>
      </div>

      <Card>
        <CardHeader
          title="Próximos cultos"
          description="Ordenados por data. Clique para ver a escala completa."
        />
        {!events || events.length === 0 ? (
          <EmptyState>
            Nenhum culto futuro cadastrado.{" "}
            <Link href="/cultos" className="text-sky-600 dark:text-sky-400 hover:underline">
              Gerar cultos do mês
            </Link>
            .
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border-soft">
            {events.map((ev) => {
              const total = ev.assignments?.length ?? 0;
              const filled =
                ev.assignments?.filter((a) => a.status !== "unfilled").length ??
                0;
              const declined =
                ev.assignments?.filter((a) => a.status === "declined").length ??
                0;
              const complete = total > 0 && filled === total && declined === 0;
              return (
                <li key={ev.id}>
                  <Link
                    href={`/cultos/${ev.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2"
                  >
                    <div>
                      <div className="font-medium text-fg">
                        {ev.title}
                        {ev.kind === "extra" ? (
                          <Badge tone="sky" className="ml-2">
                            Extra
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-sm text-fg-muted">
                        {formatShort(ev.event_date)}
                        {ev.start_time ? ` • ${formatTime(ev.start_time)}` : ""} •{" "}
                        {ev.event_teams?.length ?? 0} equipe(s)
                      </div>
                    </div>
                    <div className="text-right">
                      {declined > 0 ? (
                        <Badge tone="red">{declined} sem poder</Badge>
                      ) : complete ? (
                        <Badge tone="green">Completo</Badge>
                      ) : (
                        <Badge tone="amber">
                          {filled}/{total} preenchidas
                        </Badge>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Trocas em aberto"
          description="Alguém avisou que não poderá e ainda não foi substituído."
        />
        {relevantSwaps.length === 0 ? (
          <EmptyState>Nenhuma troca pendente.</EmptyState>
        ) : (
          <ul className="divide-y divide-border-soft">
            {relevantSwaps.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div>
                  <div className="font-medium text-fg">
                    {s.assignments?.person?.full_name ?? "—"} •{" "}
                    {s.assignments?.roles?.name}
                  </div>
                  <div className="text-sm text-fg-muted">
                    {s.assignments?.events?.title} —{" "}
                    {s.assignments?.events?.event_date
                      ? formatShort(s.assignments.events.event_date)
                      : ""}
                    {s.reason ? ` • "${s.reason}"` : ""}
                  </div>
                </div>
                {s.assignments?.event_id ? (
                  <ButtonLink
                    href={`/cultos/${s.assignments.event_id}/escala`}
                    size="sm"
                    variant="secondary"
                  >
                    Resolver
                  </ButtonLink>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
