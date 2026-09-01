"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function addAccess(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "coordenador");

  if (fullName.length < 2) return { error: "Informe o nome." };
  if (!email) return { error: "Informe o e-mail." };
  if (role !== "admin_geral" && role !== "coordenador")
    return { error: "Papel inválido." };

  const { data: existing } = await supabase
    .from("users")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("users")
      .update({ role, full_name: fullName })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("users")
      .insert({ full_name: fullName, email, role });
    if (error) return { error: error.message };
  }

  revalidatePath("/config");
  return {
    ok: true,
    message:
      "Acesso criado. Peça para a pessoa abrir “Primeiro acesso” e definir a senha com este e-mail.",
  };
}

export async function updateWhatsAppTarget(
  targetId: string,
  _prev: unknown,
  formData: FormData,
) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("whatsapp_targets")
    .update({
      label: String(formData.get("label") || "").trim(),
      chat_id: String(formData.get("chat_id") || "").trim() || null,
      active: formData.get("active") === "on",
    })
    .eq("id", targetId);
  if (error) return { error: error.message };
  revalidatePath("/config");
  return { ok: true };
}

export async function saveGeneralSettings(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const entries: { key: string; value: unknown }[] = [
    {
      key: "public_base_url",
      value: String(formData.get("public_base_url") || "").trim(),
    },
    {
      key: "cron_request_availability_enabled",
      value: formData.get("cron_request_availability_enabled") === "on",
    },
    {
      key: "cron_weekly_reminders_enabled",
      value: formData.get("cron_weekly_reminders_enabled") === "on",
    },
    {
      key: "cron_event_summary_enabled",
      value: formData.get("cron_event_summary_enabled") === "on",
    },
  ];

  for (const e of entries) {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: e.key, value: e.value as never, updated_at: new Date().toISOString() });
    if (error) return { error: error.message };
  }

  revalidatePath("/config");
  return { ok: true };
}
