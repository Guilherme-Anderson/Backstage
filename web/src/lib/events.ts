import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { TemplateAssignment, TemplateEvent } from "@/lib/templates";

type DB = SupabaseClient<Database>;

export type ConsolidatedAssignment = {
  id: string;
  roleId: string;
  roleName: string;
  roleSort: number;
  personId: string | null;
  personName: string | null;
  status: Database["public"]["Enums"]["assignment_status"];
  confirmToken: string;
};

export type ConsolidatedTeam = {
  teamId: string;
  teamName: string;
  sort: number;
  assignments: ConsolidatedAssignment[];
};

export type ConsolidatedEvent = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  kind: Database["public"]["Enums"]["event_kind"];
  teams: ConsolidatedTeam[];
  info: {
    preacher: string | null;
    songs: string | null;
    groups_participations: string | null;
    service_order: string | null;
    notes: string | null;
  } | null;
};

export async function loadConsolidatedEvent(
  supabase: DB,
  eventId: string,
): Promise<ConsolidatedEvent | null> {
  const { data: ev } = await supabase
    .from("events")
    .select("id, title, event_date, start_time, kind")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev) return null;

  const [{ data: eventTeams }, { data: assignments }, { data: info }] =
    await Promise.all([
      supabase
        .from("event_teams")
        .select("team_id, teams(id, name, sort_order)")
        .eq("event_id", eventId),
      supabase
        .from("assignments")
        .select(
          "id, team_id, role_id, user_id, status, confirm_token, roles(name, sort_order), person:users!assignments_user_id_fkey(full_name)",
        )
        .eq("event_id", eventId),
      supabase
        .from("event_info")
        .select(
          "preacher, songs, groups_participations, service_order, notes",
        )
        .eq("event_id", eventId)
        .maybeSingle(),
    ]);

  const teams: ConsolidatedTeam[] = (eventTeams ?? [])
    .map((et) => {
      const teamAssignments: ConsolidatedAssignment[] = (assignments ?? [])
        .filter((a) => a.team_id === et.team_id)
        .map((a) => ({
          id: a.id,
          roleId: a.role_id,
          roleName: a.roles?.name ?? "Função",
          roleSort: a.roles?.sort_order ?? 0,
          personId: a.user_id,
          personName: a.person?.full_name ?? null,
          status: a.status,
          confirmToken: a.confirm_token,
        }))
        .sort((x, y) => x.roleSort - y.roleSort || x.roleName.localeCompare(y.roleName));
      return {
        teamId: et.team_id,
        teamName: et.teams?.name ?? "Equipe",
        sort: et.teams?.sort_order ?? 0,
        assignments: teamAssignments,
      };
    })
    .sort((a, b) => a.sort - b.sort);

  return {
    id: ev.id,
    title: ev.title,
    date: ev.event_date,
    time: ev.start_time,
    kind: ev.kind,
    teams,
    info: info ?? null,
  };
}

/** Converte para o formato do gerador de mensagem (resumo D-1). */
export function toTemplateEvent(ev: ConsolidatedEvent): TemplateEvent {
  const assignments: TemplateAssignment[] = [];
  for (const team of ev.teams) {
    for (const a of team.assignments) {
      assignments.push({
        team: team.teamName,
        role: a.roleName,
        person: a.personName,
        confirmed: a.status === "confirmed",
        declined: a.status === "declined",
      });
    }
  }
  return {
    title: ev.title,
    date: ev.date,
    time: ev.time,
    assignments,
  };
}
