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
 * Define (ou limpa, com userId=null) a pessoa de uma vaga.
 * A RLS garante que só o coordenador da equipe (ou admin) consegue.
 */
export async function assignPerson(
  eventId: string,
  assignmentId: string,
  userId: string | null,
) {
  const session = await requireLogin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("assignments")
    .update({ user_id: userId })
    .eq("id", assignmentId);
  if (error) throw new Error(error.message);

  // Se havia uma troca em aberto para esta vaga e agora há substituto, resolve.
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

  revalidatePath(`/cultos/${eventId}/escala`);
  revalidatePath(`/cultos/${eventId}`);
}
