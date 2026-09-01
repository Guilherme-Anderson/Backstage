import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge, EmptyState, ButtonLink } from "@/components/ui";
import {
  currentYearMonth,
  daysInMonth,
  formatShort,
  formatTime,
  monthLabel,
} from "@/lib/dates";
import { GenerateRecurringButton } from "./generate-button";
import { NewExtraEventForm } from "./new-extra-form";

export const dynamic = "force-dynamic";

export default async function CultosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  const now = currentYearMonth();
  const year = Number(sp.ano) || now.year;
  const month = Number(sp.mes) || now.month;

  const session = await requireSession();
  const supabase = await createClient();

  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = `${year}-${String(month).padStart(2, "0")}-${String(
    daysInMonth(year, month),
  ).padStart(2, "0")}`;

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, event_date, start_time, kind, event_teams(team_id), assignments(status)",
    )
    .gte("event_date", first)
    .lte("event_date", last)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, active")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Cultos e eventos</h1>
          <p className="text-sm text-zinc-500 capitalize">
            {monthLabel(year, month)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink
            href={`/cultos?ano=${prev.y}&mes=${prev.m}`}
            variant="secondary"
            size="sm"
          >
            ← Anterior
          </ButtonLink>
          <ButtonLink
            href={`/cultos?ano=${next.y}&mes=${next.m}`}
            variant="secondary"
            size="sm"
          >
            Próximo →
          </ButtonLink>
          {session.isAdmin ? (
            <ButtonLink
              href="/cultos/recorrencias"
              variant="ghost"
              size="sm"
            >
              Recorrências
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader
          title="Cultos do mês"
          description="Gere os cultos fixos (quarta e domingo) e crie eventos extras."
          action={<GenerateRecurringButton year={year} month={month} />}
        />
        {!events || events.length === 0 ? (
          <EmptyState>
            Nenhum culto neste mês. Use “Gerar cultos recorrentes”.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {events.map((ev) => {
              const total = ev.assignments?.length ?? 0;
              const filled =
                ev.assignments?.filter((a) => a.status !== "unfilled").length ??
                0;
              const declined =
                ev.assignments?.filter((a) => a.status === "declined").length ??
                0;
              return (
                <li key={ev.id}>
                  <Link
                    href={`/cultos/${ev.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50"
                  >
                    <div>
                      <div className="font-medium text-zinc-900">
                        {ev.title}
                        {ev.kind === "extra" ? (
                          <Badge tone="sky" className="ml-2">
                            Extra
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-sm text-zinc-500">
                        {formatShort(ev.event_date)}
                        {ev.start_time
                          ? ` • ${formatTime(ev.start_time)}`
                          : ""}{" "}
                        • {ev.event_teams?.length ?? 0} equipe(s)
                      </div>
                    </div>
                    {declined > 0 ? (
                      <Badge tone="red">{declined} sem poder</Badge>
                    ) : total > 0 && filled === total ? (
                      <Badge tone="green">Completo</Badge>
                    ) : (
                      <Badge tone="amber">
                        {filled}/{total}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">
          Novo evento extra
        </h2>
        <NewExtraEventForm teams={teams ?? []} defaultDate={first} />
      </Card>
    </div>
  );
}
