"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function saveTemplate(
  templateId: string,
  _prev: unknown,
  formData: FormData,
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_templates")
    .update({
      name: String(formData.get("name") || "").trim(),
      default_start_time:
        String(formData.get("default_start_time") || "").trim() || null,
      active: formData.get("active") === "on",
    })
    .eq("id", templateId);
  if (error) return { error: error.message };

  const teamIds = formData.getAll("team_ids").map(String).filter(Boolean);
  await supabase
    .from("event_template_teams")
    .delete()
    .eq("event_template_id", templateId);
  if (teamIds.length > 0) {
    await supabase
      .from("event_template_teams")
      .insert(teamIds.map((t) => ({ event_template_id: templateId, team_id: t })));
  }

  revalidatePath("/cultos/recorrencias");
  return { ok: true };
}
