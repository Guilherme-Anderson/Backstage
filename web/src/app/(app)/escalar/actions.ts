"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppSession } from "@/lib/auth";

async function requireLogin() {
  const session = await getAppSession();
  if (!session || !session.hasLogin) throw new Error("Sem sessão.");
  return session;
}

/** Define ou limpa (userId=null) a pessoa de uma vaga. RLS confere a equipe. */
export async function assignSlot(
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
