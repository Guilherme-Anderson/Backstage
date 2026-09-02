import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui";
import { formatShort } from "@/lib/dates";
import { SWAP_STATUS_LABEL } from "@/lib/constants";
import { SwapRow } from "./swap-row";

export const dynamic = "force-dynamic";

export default async function TrocasPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: swaps } = await supabase
    .from("swap_requests")
    .select(
      "id, reason, status, created_at, assignment_id, assignments(team_id, event_id, roles(name), events(title, event_date), person:users!assignments_user_id_fkey(full_name)), replacement:users!swap_requests_replacement_user_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const visible = (swaps ?? []).filter(
    (s) =>
      session.isAdmin ||
      (s.assignments &&
        session.coordinatorTeamIds.includes(s.assignments.team_id)),
  );
  const open = visible.filter((s) => s.status === "open");
  const closed = visible.filter((s) => s.status !== "open");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Trocas</h1>
        <p className="text-sm text-fg-muted">
          Quando alguém avisa que não pode, aparece aqui para você achar um
          substituto.
        </p>
      </div>

      <Card>
        <CardHeader title="Em aberto" />
        {open.length === 0 ? (
          <EmptyState>Nenhuma troca pendente. 🎉</EmptyState>
        ) : (
          <ul className="divide-y divide-border-soft">
            {open.map((s) => (
              <SwapRow
                key={s.id}
                swapId={s.id}
                person={s.assignments?.person?.full_name ?? "—"}
                role={s.assignments?.roles?.name ?? ""}
                eventTitle={s.assignments?.events?.title ?? ""}
                eventDate={
                  s.assignments?.events?.event_date
                    ? formatShort(s.assignments.events.event_date)
                    : ""
                }
                reason={s.reason}
                eventId={s.assignments?.event_id ?? null}
              />
            ))}
          </ul>
        )}
      </Card>

      {closed.length > 0 ? (
        <Card>
          <CardHeader title="Histórico" />
          <ul className="divide-y divide-border-soft">
            {closed.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <div>
                  <div className="font-medium text-fg">
                    {s.assignments?.person?.full_name} ·{" "}
                    {s.assignments?.roles?.name}
                  </div>
                  <div className="text-fg-muted">
                    {s.assignments?.events?.title}
                    {s.replacement?.full_name
                      ? ` → ${s.replacement.full_name}`
                      : ""}
                  </div>
                </div>
                <Badge>{SWAP_STATUS_LABEL[s.status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
