import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TeamManager } from "./team-manager";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: team }, { data: members }, { data: roles }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, description, active")
      .eq("id", teamId)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select(
        "id, is_coordinator, active, joined_at, users(id, full_name, phone_e164, email, role, active)",
      )
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true }),
    supabase
      .from("roles")
      .select("id, name, active, sort_order")
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true }),
  ]);
  if (!team) notFound();

  const canManage =
    session.isAdmin || session.coordinatorTeamIds.includes(teamId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/equipes" className="text-sm text-link hover:underline">
          ← Equipes
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-fg">{team.name}</h1>
        <p className="text-sm text-fg-muted">{team.description || "—"}</p>
      </div>

      {!canManage ? (
        <p className="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Você pode ver esta equipe, mas só o coordenador dela ou um administrador
          podem editar.
        </p>
      ) : null}

      <TeamManager
        team={team}
        members={members ?? []}
        roles={roles ?? []}
        canManage={canManage}
        isAdmin={session.isAdmin}
      />
    </div>
  );
}
