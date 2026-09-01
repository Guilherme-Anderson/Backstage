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

export async function generateRecurring(year: number, month: number) {
  await requireLogin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("generate_recurring_events", {
    p_year: year,
    p_month: month,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/cultos");
}

export async function createExtraEvent(_prev: unknown, formData: FormData) {
  await requireLogin();
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("event_date") || "").trim();
  const time = String(formData.get("start_time") || "").trim() || null;
  const teamIds = formData.getAll("team_ids").map(String).filter(Boolean);

  if (title.length < 2) return { error: "Informe o nome do evento." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Informe a data." };
  if (teamIds.length === 0)
    return { error: "Selecione ao menos uma equipe participante." };

  const { data: ev, error } = await supabase
    .from("events")
    .insert({ title, event_date: date, start_time: time, kind: "extra" })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: teamErr } = await supabase.rpc("set_event_teams", {
    p_event_id: ev.id,
    p_team_ids: teamIds,
  });
  if (teamErr) return { error: teamErr.message };

  revalidatePath("/cultos");
  redirect(`/cultos/${ev.id}`);
}

export async function updateEventBasics(
  eventId: string,
  _prev: unknown,
  formData: FormData,
) {
  await requireLogin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      title: String(formData.get("title") || "").trim(),
      event_date: String(formData.get("event_date") || "").trim(),
      start_time: String(formData.get("start_time") || "").trim() || null,
    })
    .eq("id", eventId);
  if (error) return { error: error.message };
  revalidatePath(`/cultos/${eventId}`);
  return { ok: true };
}

export async function setEventTeams(eventId: string, teamIds: string[]) {
  await requireLogin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_event_teams", {
    p_event_id: eventId,
    p_team_ids: teamIds,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/cultos/${eventId}`);
}

export async function saveEventInfo(
  eventId: string,
  _prev: unknown,
  formData: FormData,
) {
  const session = await requireLogin();
  const supabase = await createClient();
  const { error } = await supabase.from("event_info").upsert({
    event_id: eventId,
    preacher: String(formData.get("preacher") || "").trim() || null,
    songs: String(formData.get("songs") || "").trim() || null,
    groups_participations:
      String(formData.get("groups_participations") || "").trim() || null,
    service_order: String(formData.get("service_order") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    updated_by: session.profile?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/cultos/${eventId}`);
  return { ok: true };
}

export async function deleteEvent(eventId: string) {
  await requireLogin();
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath("/cultos");
  redirect("/cultos");
}
