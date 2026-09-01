"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppSession } from "@/lib/auth";
import { toE164BR } from "@/lib/utils";

async function assertCanManage(teamId: string) {
  const session = await getAppSession();
  if (!session || !session.hasLogin) throw new Error("Sem sessão.");
  if (!session.isAdmin && !session.coordinatorTeamIds.includes(teamId)) {
    throw new Error("Você não coordena esta equipe.");
  }
  return session;
}

/* ------------------------------- Equipe ------------------------------- */
export async function updateTeam(teamId: string, _prev: unknown, formData: FormData) {
  const session = await assertCanManage(teamId);
  if (!session.isAdmin) return { error: "Apenas administradores editam a equipe." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim() || null,
      active: formData.get("active") === "on",
    })
    .eq("id", teamId);
  if (error) return { error: error.message };
  revalidatePath(`/equipes/${teamId}`);
  return { ok: true };
}

/* ------------------------------ Membros ------------------------------ */
export async function addMember(teamId: string, _prev: unknown, formData: FormData) {
  const session = await assertCanManage(teamId);
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") || "").trim();
  const phoneRaw = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase() || null;
  const wantsCoordinator = formData.get("is_coordinator") === "on";
  const asLogin = session.isAdmin && formData.get("as_login") === "on";

  if (fullName.length < 2) return { error: "Informe o nome completo." };
  const phone = phoneRaw ? toE164BR(phoneRaw) : null;
  if (phoneRaw && !phone) return { error: "Telefone inválido. Use DDD + número." };
  if (asLogin && !email) return { error: "Para dar acesso ao app, informe o e-mail." };

  // reaproveita pessoa existente pelo telefone/e-mail
  let userId: string | null = null;
  if (phone) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("phone_e164", phone)
      .maybeSingle();
    userId = data?.id ?? null;
  }
  if (!userId && email) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    userId = data?.id ?? null;
  }

  let createdHere = false;
  if (!userId) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        full_name: fullName,
        phone_e164: phone,
        email,
        role: asLogin ? "coordenador" : "membro",
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    userId = data.id;
    createdHere = true;
  }

  const { error: memErr } = await supabase.from("team_members").insert({
    team_id: teamId,
    user_id: userId,
    is_coordinator: wantsCoordinator || asLogin,
  });
  if (memErr) {
    if (createdHere) await supabase.from("users").delete().eq("id", userId);
    if (memErr.code === "23505")
      return { error: "Essa pessoa já está nesta equipe." };
    return { error: memErr.message };
  }

  revalidatePath(`/equipes/${teamId}`);
  return { ok: true };
}

export async function setMemberFlag(
  teamId: string,
  memberId: string,
  field: "is_coordinator" | "active",
  value: boolean,
) {
  await assertCanManage(teamId);
  const supabase = await createClient();
  const patch: { is_coordinator?: boolean; active?: boolean } = {};
  patch[field] = value;
  await supabase.from("team_members").update(patch).eq("id", memberId);
  revalidatePath(`/equipes/${teamId}`);
}

export async function removeMember(teamId: string, memberId: string) {
  await assertCanManage(teamId);
  const supabase = await createClient();
  await supabase.from("team_members").delete().eq("id", memberId);
  revalidatePath(`/equipes/${teamId}`);
}

export async function updatePerson(
  teamId: string,
  userId: string,
  _prev: unknown,
  formData: FormData,
) {
  await assertCanManage(teamId);
  const supabase = await createClient();
  const phoneRaw = String(formData.get("phone") || "").trim();
  const phone = phoneRaw ? toE164BR(phoneRaw) : null;
  if (phoneRaw && !phone) return { error: "Telefone inválido." };
  const { error } = await supabase
    .from("users")
    .update({
      full_name: String(formData.get("full_name") || "").trim(),
      phone_e164: phone,
    })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath(`/equipes/${teamId}`);
  return { ok: true };
}

/* ------------------------------ Funções ------------------------------ */
export async function addRole(teamId: string, _prev: unknown, formData: FormData) {
  await assertCanManage(teamId);
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) return { error: "Informe o nome da função." };

  const key =
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || `funcao_${Date.now()}`;

  const { data: maxRow } = await supabase
    .from("roles")
    .select("sort_order")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("roles").insert({
    team_id: teamId,
    key,
    name,
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  });
  if (error) {
    if (error.code === "23505")
      return { error: "Já existe uma função com esse nome." };
    return { error: error.message };
  }
  revalidatePath(`/equipes/${teamId}`);
  return { ok: true };
}

export async function setRoleActive(
  teamId: string,
  roleId: string,
  value: boolean,
) {
  await assertCanManage(teamId);
  const supabase = await createClient();
  await supabase.from("roles").update({ active: value }).eq("id", roleId);
  revalidatePath(`/equipes/${teamId}`);
}
