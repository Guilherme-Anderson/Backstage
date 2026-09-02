import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatLong, formatTime, weekdayOf } from "@/lib/dates";
import { AssignmentBoard, type BoardTeam } from "./assignment-board";

export const dynamic = "force-dynamic";

type Availability = "yes" | "no" | "unknown";

export default async function EscalaPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, event_date, start_time")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) notFound();

  const dow = weekdayOf(event.event_date);
  const block: "wednesday" | "sunday" | null =
    dow === 0 ? "sunday" : dow === 3 ? "wednesday" : null;
  const [yearStr, monthStr] = event.event_date.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  // --- fase 1: tudo que só depende do evento (em paralelo) ---
  const [{ data: eventTeams }, { data: assignments }, { data: sameDayEvents }] =
    await Promise.all([
      supabase
        .from("event_teams")
        .select("team_id, teams(id, name, sort_order)")
        .eq("event_id", eventId),
      supabase
        .from("assignments")
        .select("id, team_id, role_id, user_id, status, roles(name, sort_order)")
        .eq("event_id", eventId),
      supabase
        .from("events")
        .select("id, title")
        .eq("event_date", event.event_date)
        .neq("id", eventId),
    ]);

  const teamIds = (eventTeams ?? []).map((t) => t.team_id);
  const sameDayIds = (sameDayEvents ?? []).map((e) => e.id);
  const sameDayTitle = new Map((sameDayEvents ?? []).map((e) => [e.id, e.title]));

  // --- fase 2: depende de teamIds / sameDayIds (em paralelo) ---
  const memberQuery = teamIds.length
    ? supabase
        .from("team_members")
        .select("team_id, user_id, users!inner(id, full_name, active)")
        .in("team_id", teamIds)
        .eq("active", true)
        .eq("users.active", true)
    : null;
  const cycleQuery =
    block && teamIds.length
      ? supabase
          .from("availability_cycles")
          .select("id, team_id")
          .in("team_id", teamIds)
          .eq("year", year)
          .eq("month", month)
      : null;
  const sameDayAssignQuery = sameDayIds.length
    ? supabase
        .from("assignments")
        .select("user_id, event_id")
        .in("event_id", sameDayIds)
        .not("user_id", "is", null)
    : null;

  const [memberRes, cycleRes, sameDayAssignRes] = await Promise.all([
    memberQuery,
    cycleQuery,
    sameDayAssignQuery,
  ]);
  const memberRows = memberRes?.data ?? [];
  const cycles = cycleRes?.data ?? [];

  // --- conflitos no mesmo dia ---
  const elsewhereByUser = new Map<string, string[]>();
  for (const a of sameDayAssignRes?.data ?? []) {
    if (!a.user_id) continue;
    const list = elsewhereByUser.get(a.user_id) ?? [];
    list.push(sameDayTitle.get(a.event_id) ?? "outro culto");
    elsewhereByUser.set(a.user_id, list);
  }

  // --- disponibilidade para a data exata do culto ---
  const availabilityByKey = new Map<string, Availability>();
  if (block && cycles.length) {
    const cycleTeam = new Map(cycles.map((c) => [c.id, c.team_id]));
    const cycleIds = cycles.map((c) => c.id);

    const { data: responses } = await supabase
      .from("availability_responses")
      .select("id, user_id, cycle_id, submitted_at")
      .in("cycle_id", cycleIds);
    const respIds = (responses ?? []).map((r) => r.id);

    const { data: dates } = respIds.length
      ? await supabase
          .from("availability_dates")
          .select("response_id, available")
          .in("response_id", respIds)
          .eq("service_date", event.event_date)
          .eq("block", block)
      : { data: [] };
    const availByResp = new Map(
      (dates ?? []).map((d) => [d.response_id, d.available]),
    );

    for (const r of responses ?? []) {
      const teamId = cycleTeam.get(r.cycle_id);
      if (!teamId) continue;
      const key = `${teamId}:${r.user_id}`;
      availabilityByKey.set(
        key,
        !r.submitted_at ? "unknown" : availByResp.get(r.id) ? "yes" : "no",
      );
    }
  }

  const membersByTeam = new Map<
    string,
    { id: string; name: string }[]
  >();
  for (const m of memberRows ?? []) {
    const list = membersByTeam.get(m.team_id) ?? [];
    if (m.users) list.push({ id: m.users.id, name: m.users.full_name });
    membersByTeam.set(m.team_id, list);
  }

  const teams: BoardTeam[] = (eventTeams ?? [])
    .map((et) => {
      const teamId = et.team_id;
      const canManage =
        session.isAdmin || session.coordinatorTeamIds.includes(teamId);
      const roles = (assignments ?? [])
        .filter((a) => a.team_id === teamId)
        .map((a) => ({
          assignmentId: a.id,
          roleName: a.roles?.name ?? "Função",
          roleSort: a.roles?.sort_order ?? 0,
          currentUserId: a.user_id,
          status: a.status,
        }))
        .sort((x, y) => x.roleSort - y.roleSort);
      const members = (membersByTeam.get(teamId) ?? [])
        .map((mm) => ({
          id: mm.id,
          name: mm.name,
          availability: availabilityByKey.get(`${teamId}:${mm.id}`) ?? "unknown",
          elsewhere: elsewhereByUser.get(mm.id) ?? [],
        }))
        .sort((a, b) => {
          const rank = { yes: 0, unknown: 1, no: 2 } as const;
          return (
            rank[a.availability] - rank[b.availability] ||
            a.name.localeCompare(b.name)
          );
        });
      return {
        teamId,
        teamName: et.teams?.name ?? "Equipe",
        sort: et.teams?.sort_order ?? 0,
        canManage,
        roles,
        members,
      };
    })
    .sort((a, b) => a.sort - b.sort);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/cultos/${eventId}`}
          className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
        >
          ← {event.title}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-fg">
          Montar escala
        </h1>
        <p className="text-sm text-fg-muted">
          {formatLong(event.event_date)}
          {event.start_time ? ` • ${formatTime(event.start_time)}` : ""}
        </p>
      </div>

      {block === null ? (
        <p className="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Este evento não cai numa quarta nem num domingo, então não há
          disponibilidade mensal para cruzar. Você ainda pode escalar livremente.
        </p>
      ) : null}

      <AssignmentBoard eventId={eventId} teams={teams} />
    </div>
  );
}
