import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["users"]["Row"];

export type AppSession = {
  authUserId: string;
  email: string | null;
  profile: Profile | null;
  isAdmin: boolean;
  hasLogin: boolean;
  /** Equipes onde a pessoa é coordenadora. */
  coordinatorTeamIds: string[];
};

/**
 * Carrega a sessão do app para a requisição atual.
 * `null` = ninguém logado.
 */
export const getAppSession = cache(async (): Promise<AppSession | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: hasLogin }, { data: isAdmin }] = await Promise.all([
    supabase.rpc("has_app_login"),
    supabase.rpc("is_admin"),
  ]);

  let profile: Profile | null = null;
  let coordinatorTeamIds: string[] = [];

  if (hasLogin) {
    const { data: prof } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    profile = prof ?? null;

    if (profile) {
      const { data: memberships } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", profile.id)
        .eq("is_coordinator", true)
        .eq("active", true);
      coordinatorTeamIds = (memberships ?? []).map((m) => m.team_id);
    }
  }

  return {
    authUserId: user.id,
    email: user.email ?? null,
    profile,
    isAdmin: Boolean(isAdmin),
    hasLogin: Boolean(hasLogin),
    coordinatorTeamIds,
  };
});

/** Exige login válido (admin ou coordenador). Redireciona caso contrário. */
export async function requireSession(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) redirect("/entrar");
  if (!session.hasLogin) redirect("/sem-acesso");
  return session;
}

export async function requireAdmin(): Promise<AppSession> {
  const session = await requireSession();
  if (!session.isAdmin) redirect("/sem-acesso");
  return session;
}

export function canManageTeam(session: AppSession, teamId: string): boolean {
  return session.isAdmin || session.coordinatorTeamIds.includes(teamId);
}
