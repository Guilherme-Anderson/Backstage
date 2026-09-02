import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState } from "@/components/ui";
import { daysInMonth, monthLabel, schedulingYearMonth } from "@/lib/dates";
import {
  MonthBoard,
  type BoardEvent,
  type Availability,
} from "./month-board";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const NIL = "00000000-0000-0000-0000-000000000000";

export default async function EscalarPage({
  searchParams,
}: {
  searchParams: Promise<{ equipe?: string; ano?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: allTeams } = await supabase
    .from("teams")
    .select("id, name, active")
    .order("sort_order", { ascending: true });

  const manageable = (allTeams ?? []).filter(
    (t) =>
      t.active &&
      (session.isAdmin || session.coordinatorTeamIds.includes(t.id)),
  );

  if (manageable.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-fg">Montar escala</h1>
        <Card>
          <EmptyState>
            Você não coordena nenhuma equipe. Peça a um administrador para te
            vincular como coordenador em{" "}
            <Link href="/equipes" className="text-link hover:underline">
              Equipes
            </Link>
            .
          </EmptyState>
        </Card>
      </div>
    );
  }

  const teamId =
    sp.equipe && manageable.some((t) => t.id === sp.equipe)
      ? sp.equipe
      : manageable[0].id;
  const teamName = manageable.find((t) => t.id === teamId)!.name;

  const def = schedulingYearMonth();
  const year = Number(sp.ano) || def.year;
  const month = Number(sp.mes) || def.month;
  const first = `${year}-${pad(month)}-01`;
  const last = `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`;

  // eventos do mês que incluem esta equipe
  const { data: etRows } = await supabase
    .from("event_teams")
    .select(
      "event_id, events!inner(id, title, event_date, start_time, kind)",
    )
    .eq("team_id", teamId)
    .gte("events.event_date", first)
    .lte("events.event_date", last);

  const evList = (etRows ?? [])
    .map((r) => r.events)
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .sort(
      (a, b) =>
        a.event_date.localeCompare(b.event_date) ||
        (a.start_time ?? "").localeCompare(b.start_time ?? ""),
    );
  const eventIds = evList.map((e) => e.id);

  const [{ data: assignments }, { data: memberRows }, { data: cycle }] =
    await Promise.all([
      supabase
        .from("assignments")
        .select("id, event_id, role_id, user_id, status, roles(name, sort_order)")
        .eq("team_id", teamId)
        .in("event_id", eventIds.length ? eventIds : [NIL]),
      supabase
        .from("team_members")
        .select("user_id, users!inner(id, full_name, active)")
        .eq("team_id", teamId)
        .eq("active", true)
        .eq("users.active", true),
      supabase
        .from("availability_cycles")
        .select("id, status")
        .eq("team_id", teamId)
        .eq("year", year)
        .eq("month", month)
        .maybeSingle(),
    ]);

  // disponibilidade
  const submitted = new Set<string>();
  const availByUserDate = new Map<string, boolean>();
  if (cycle) {
    const { data: responses } = await supabase
      .from("availability_responses")
      .select("id, user_id, submitted_at")
      .eq("cycle_id", cycle.id);
    const respUser = new Map(
      (responses ?? []).map((r) => [r.id, r.user_id]),
    );
    for (const r of responses ?? [])
      if (r.submitted_at) submitted.add(r.user_id);
    const respIds = (responses ?? []).map((r) => r.id);
    const { data: dates } = respIds.length
      ? await supabase
          .from("availability_dates")
          .select("response_id, service_date, available")
          .in("response_id", respIds)
      : { data: [] };
    for (const d of dates ?? []) {
      const uid = respUser.get(d.response_id);
      if (uid) availByUserDate.set(`${uid}|${d.service_date}`, d.available);
    }
  }

  // conflitos no mesmo dia (qualquer equipe)
  const { data: monthBookings } = await supabase
    .from("assignments")
    .select("user_id, events!inner(event_date, title)")
    .not("user_id", "is", null)
    .gte("events.event_date", first)
    .lte("events.event_date", last);
  const bookedByUserDate = new Map<string, string[]>();
  for (const b of monthBookings ?? []) {
    if (!b.user_id || !b.events) continue;
    const key = `${b.user_id}|${b.events.event_date}`;
    const list = bookedByUserDate.get(key) ?? [];
    list.push(b.events.title);
    bookedByUserDate.set(key, list);
  }

  const members = (memberRows ?? [])
    .map((m) => m.users)
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => ({ id: u.id, name: u.full_name }));

  function availabilityFor(userId: string, date: string): Availability {
    if (!cycle || !submitted.has(userId)) return "unknown";
    const v = availByUserDate.get(`${userId}|${date}`);
    return v === undefined ? "unknown" : v ? "yes" : "no";
  }

  const rank = { yes: 0, unknown: 1, no: 2 } as const;

  const events: BoardEvent[] = evList.map((e) => {
    const slots = (assignments ?? [])
      .filter((a) => a.event_id === e.id)
      .map((a) => ({
        assignmentId: a.id,
        roleName: a.roles?.name ?? "Função",
        roleSort: a.roles?.sort_order ?? 0,
        currentUserId: a.user_id,
        status: a.status,
      }))
      .sort((x, y) => x.roleSort - y.roleSort);

    const candidates = members
      .map((m) => ({
        id: m.id,
        name: m.name,
        avail: availabilityFor(m.id, e.event_date),
        busy: (bookedByUserDate.get(`${m.id}|${e.event_date}`) ?? []).filter(
          (t) => t !== e.title,
        ),
      }))
      .sort(
        (a, b) => rank[a.avail] - rank[b.avail] || a.name.localeCompare(b.name),
      );

    return {
      id: e.id,
      title: e.title,
      date: e.event_date,
      time: e.start_time,
      kind: e.kind,
      slots,
      candidates,
    };
  });

  return (
    <MonthBoard
      teams={manageable}
      teamId={teamId}
      teamName={teamName}
      year={year}
      month={month}
      monthLabel={monthLabel(year, month)}
      events={events}
      cycleStatus={cycle?.status ?? null}
    />
  );
}
