"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function createTeam(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  if (name.length < 2) return { error: "Informe o nome da equipe." };

  const supabase = await createClient();
  const key = slugify(name) || `equipe_${Date.now()}`;

  const { data: maxRow } = await supabase
    .from("teams")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      name,
      key,
      description,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // função genérica inicial
  await supabase.from("roles").insert({
    team_id: team.id,
    key: "operacao",
    name: `Operação — ${name}`,
    sort_order: 1,
  });

  // alvo de WhatsApp da equipe (chat_id preenchido na leva 2)
  await supabase
    .from("whatsapp_targets")
    .insert({ kind: "team", team_id: team.id, label: `Grupo — ${name}` });

  revalidatePath("/equipes");
  redirect(`/equipes/${team.id}`);
}
