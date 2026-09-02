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
 * Carrega a sessão do app para a requisição atual — uma única query além do
 * getUser(). `null` = ninguém logado.
 */
export const getAppSession = cache(async (): Promise<AppSession | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const base = {
    authUserId: user.id,
    email: user.email ?? null,
  };

  // Uma query: perfil + vínculos de coordenação. Se a pessoa não tem papel de
  // login, a RLS de `users` bloqueia e `prof` volta null.
  const { data: prof } = await supabase
    .from("users")
    .select("*, team_members(team_id, is_coordinator, active)")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!prof) {
    return {
      ...base,
      profile: null,
      isAdmin: false,
      hasLogin: false,
      coordinatorTeamIds: [],
    };
  }

  const { team_members: memberships, ...profile } = prof as Profile & {
    team_members: { team_id: string; is_coordinator: boolean; active: boolean }[];
  };

  const active = profile.active;
  return {
    ...base,
    profile,
    isAdmin: active && profile.role === "admin_geral",
    hasLogin:
      active &&
      (profile.role === "admin_geral" || profile.role === "coordenador"),
    coordinatorTeamIds: (memberships ?? [])
      .filter((m) => m.is_coordinator && m.active)
      .map((m) => m.team_id),
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
