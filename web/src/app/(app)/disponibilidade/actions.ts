"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppSession } from "@/lib/auth";

async function requireLogin() {
  const session = await getAppSession();
  if (!session || !session.hasLogin) throw new Error("Sem sessão.");
  return session;
}

export async function openCycle(_prev: unknown, formData: FormData) {
  const session = await requireLogin();
  const teamId = String(formData.get("team_id") || "");
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  if (!teamId) return { error: "Escolha a equipe." };
  if (!year || !month) return { error: "Escolha o mês." };
  if (!session.isAdmin && !session.coordinatorTeamIds.includes(teamId))
    return { error: "Você não coordena esta equipe." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("open_availability_cycle", {
    p_team_id: teamId,
    p_year: year,
    p_month: month,
  });
  if (error) return { error: error.message };

  revalidatePath("/disponibilidade");
  redirect(`/disponibilidade/ciclo/${data}`);
}

export async function setCycleStatus(
  cycleId: string,
  status: "open" | "closed",
) {
  await requireLogin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("availability_cycles")
    .update({ status })
    .eq("id", cycleId);
  if (error) throw new Error(error.message);
  revalidatePath(`/disponibilidade/ciclo/${cycleId}`);
  revalidatePath("/disponibilidade");
}
