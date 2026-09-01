"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppSession } from "@/lib/auth";

export async function cancelSwap(swapId: string) {
  const session = await getAppSession();
  if (!session || !session.hasLogin) throw new Error("Sem sessão.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("swap_requests")
    .update({
      status: "cancelled",
      resolved_by: session.profile?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", swapId);
  if (error) throw new Error(error.message);
  revalidatePath("/trocas");
}
