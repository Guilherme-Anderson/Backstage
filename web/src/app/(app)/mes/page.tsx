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
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");

type Cell = { role: string; person: string | null; status: string }[];

export default async function MesPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  await requireSession();
  const supabase = await createClient();

  const now = currentYearMonth();
  const year = Number(sp.ano) || now.year;
  const month = Number(sp.mes) || now.month;
  const first = `${year}-${pad(month)}-01`;
  const last = `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`;

  const [{ data: teams }, { data: events }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("events")
      .select(
        "id, title, event_date, start_time, kind, event_teams(team_id), assignments(team_id, status, roles(name, sort_order), person:users!assignments_user_id_fkey(full_name))",
      )
      .gte("event_date", first)
      .lte("event_date", last)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  const teamList = teams ?? [];
  const evs = events ?? [];

  let totalSlots = 0;
  let filled = 0;
  let declined = 0;
  for (const e of evs)
    for (const a of e.assignments ?? []) {
      totalSlots++;
      if (a.status === "confirmed" || a.status === "pending") filled++;
      if (a.status === "declined") declined++;
    }

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  function cellFor(
    ev: (typeof evs)[number],
    teamId: string,
  ): { inEvent: boolean; items: Cell } {
    const inEvent = (ev.event_teams ?? []).some((t) => t.team_id === teamId);
    const items: Cell = (ev.assignments ?? [])
      .filter((a) => a.team_id === teamId)
      .map((a) => ({
        role: a.roles?.name ?? "",
        person: a.person?.full_name ?? null,
        status: a.status,
        sort: a.roles?.sort_order ?? 0,
      }))
      .sort((x, y) => x.sort - y.sort)
      .map(({ role, person, status }) => ({ role, person, status }));
    return { inEvent, items };
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Visão do mês</h1>
          <p className="text-sm text-fg-muted capitalize">{monthLabel(year, month)}</p>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink
            href={`/mes?ano=${prev.y}&mes=${prev.m}`}
            variant="secondary"
            size="sm"
          >
            ← Anterior
          </ButtonLink>
          <ButtonLink
            href={`/mes?ano=${next.y}&mes=${next.m}`}
            variant="secondary"
            size="sm"
          >
            Próximo →
          </ButtonLink>
        </div>
      </div>

      <div className="text-sm text-fg-muted">
        {evs.length} culto(s) · {filled}/{totalSlots} vagas preenchidas
        {declined > 0 ? (
          <>
            {" "}
            ·{" "}
            <span className="text-red-600 dark:text-red-400">
              {declined} sem poder
            </span>
          </>
        ) : null}
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Escala do mês"
          description="Todas as equipes. Clique numa linha para ver o culto completo."
        />
        {evs.length === 0 || teamList.length === 0 ? (
          <EmptyState>
            Nenhum culto neste mês.{" "}
            <Link href="/cultos" className="text-link hover:underline">
              Gerar cultos
            </Link>
            .
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-soft">
                  <th className="sticky left-0 bg-surface px-4 py-2 font-medium">
                    Culto
                  </th>
                  {teamList.map((t) => (
                    <th key={t.id} className="px-3 py-2 font-medium">
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evs.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-border-soft last:border-0 hover:bg-surface-2"
                  >
                    <td className="sticky left-0 bg-surface px-4 py-2.5 align-top">
                      <Link href={`/cultos/${ev.id}`} className="block">
                        <span className="font-medium text-fg">
                          {ev.title}
                          {ev.kind === "extra" ? (
                            <Badge tone="sky" className="ml-1.5">
                              Extra
                            </Badge>
                          ) : null}
                        </span>
                        <span className="block text-xs text-fg-muted">
                          {formatShort(ev.event_date)}
                          {ev.start_time ? ` • ${formatTime(ev.start_time)}` : ""}
                        </span>
                      </Link>
                    </td>
                    {teamList.map((t) => {
                      const { inEvent, items } = cellFor(ev, t.id);
                      return (
                        <td
                          key={t.id}
                          className={cn(
                            "px-3 py-2.5 align-top",
                            !inEvent && "bg-surface-2/40",
                          )}
                        >
                          {!inEvent ? (
                            <span className="text-fg-soft">·</span>
                          ) : items.length === 0 ? (
                            <span className="text-fg-soft">sem função</span>
                          ) : (
                            <ul className="space-y-0.5">
                              {items.map((it, i) => (
                                <li key={i} className="leading-tight">
                                  {items.length > 1 ? (
                                    <span className="text-xs text-fg-soft">
                                      {it.role}:{" "}
                                    </span>
                                  ) : null}
                                  {it.person ? (
                                    <span
                                      className={cn(
                                        it.status === "declined"
                                          ? "text-red-600 line-through dark:text-red-400"
                                          : "text-fg",
                                      )}
                                    >
                                      {it.person}
                                      {it.status === "confirmed" ? (
                                        <span
                                          className="text-emerald-600 dark:text-emerald-400"
                                          title="confirmado"
                                        >
                                          {" "}
                                          ✓
                                        </span>
                                      ) : null}
                                      {it.status === "declined" ? (
                                        <span title="não poderá"> ✕</span>
                                      ) : null}
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400">
                                      —
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-soft">
        <span>
          <span className="text-emerald-600 dark:text-emerald-400">✓</span>{" "}
          confirmado
        </span>
        <span>✕ não poderá</span>
        <span>
          <span className="text-amber-600 dark:text-amber-400">—</span> vaga
          aberta
        </span>
        <span>· equipe não atua nesse culto</span>
      </p>
    </div>
  );
}
