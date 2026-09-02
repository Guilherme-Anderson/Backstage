"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppSession } from "@/lib/auth";

async function requireLogin() {
  const session = await getAppSession();
  if (!session || !session.hasLogin) throw new Error("Sem sessão.");
  return session;
}

/**
 * Define ou limpa (userId=null) a pessoa de uma vaga. A RLS confere a equipe.
 * Domingo: escalar de manhã espelha para a noite (mesma equipe/função) quando
 * a outra vaga está vazia; limpar a manhã limpa a noite se for a mesma pessoa.
 */
export async function assignSlot(assignmentId: string, userId: string | null) {
  const session = await requireLogin();
  const supabase = await createClient();

  const { data: a } = await supabase
    .from("assignments")
    .select(
      "role_id, team_id, user_id, events!inner(event_date, event_templates(key))",
    )
    .eq("id", assignmentId)
    .maybeSingle();
  if (!a) throw new Error("Vaga não encontrada.");
  const prevUser = a.user_id;

  const { error } = await supabase
    .from("assignments")
    .update({ user_id: userId })
    .eq("id", assignmentId);
  if (error) throw new Error(error.message);

  if (userId) {
    await supabase
      .from("swap_requests")
      .update({
        status: "resolved",
        replacement_user_id: userId,
        resolved_by: session.profile?.id ?? null,
        resolved_at: new Date().toISOString(),
      })
      .eq("assignment_id", assignmentId)
      .eq("status", "open");
  }

  // espelho de domingo
  const key = a.events?.event_templates?.key;
  if (key === "sunday_morning" || key === "sunday_evening") {
    const siblingKey =
      key === "sunday_morning" ? "sunday_evening" : "sunday_morning";
    const { data: sib } = await supabase
      .from("events")
      .select("id, event_templates!inner(key)")
      .eq("event_date", a.events!.event_date)
      .eq("event_templates.key", siblingKey)
      .maybeSingle();
    if (sib) {
      const { data: sibSlot } = await supabase
        .from("assignments")
        .select("id, user_id")
        .eq("event_id", sib.id)
        .eq("team_id", a.team_id)
        .eq("role_id", a.role_id)
        .maybeSingle();
      if (sibSlot) {
        if (userId && !sibSlot.user_id) {
          await supabase
            .from("assignments")
            .update({ user_id: userId })
            .eq("id", sibSlot.id);
        } else if (!userId && sibSlot.user_id === prevUser) {
          await supabase
            .from("assignments")
            .update({ user_id: null })
            .eq("id", sibSlot.id);
        }
      }
    }
  }

  revalidatePath("/escalar");
}

export async function generateMonth(year: number, month: number) {
  await requireLogin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("generate_recurring_events", {
    p_year: year,
    p_month: month,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/escalar");
  revalidatePath("/cultos");
}
