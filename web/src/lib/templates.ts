/**
 * Geração do texto das mensagens de WhatsApp.
 * Funções puras — reaproveitadas pelas Edge Functions na leva 2.
 */
import { formatLong, formatTime, monthLabel, type ISODate } from "@/lib/dates";

export type TemplateAssignment = {
  team: string;
  role: string;
  person: string | null;
  confirmed: boolean;
  declined: boolean;
};

export type TemplateEvent = {
  title: string;
  date: ISODate;
  time: string | null;
  assignments: TemplateAssignment[];
};

export type TemplateEventInfo = {
  preacher?: string | null;
  songs?: string | null;
  groups_participations?: string | null;
  service_order?: string | null;
  notes?: string | null;
};

function personLine(a: TemplateAssignment): string {
  if (!a.person) return `   • ${a.role}: _(em aberto)_`;
  const mark = a.confirmed ? " ✅" : a.declined ? " ❌" : "";
  return `   • ${a.role}: ${a.person}${mark}`;
}

/** Fluxo 6 — resumo do culto enviado 1 dia antes (grupos das equipes + liderança). */
export function buildEventSummary(
  ev: TemplateEvent,
  info: TemplateEventInfo = {},
): string {
  const lines: string[] = [];
  lines.push(`*${ev.title.toUpperCase()}*`);
  lines.push(formatLong(ev.date) + (ev.time ? ` — ${formatTime(ev.time)}` : ""));
  lines.push("");

  if (info.preacher) lines.push(`*Preletor:* ${info.preacher}`);
  if (info.groups_participations)
    lines.push(`*Grupos / participações:* ${info.groups_participations}`);

  if (info.songs) {
    lines.push("");
    lines.push("*Músicas:*");
    for (const s of info.songs.split("\n").map((x) => x.trim()).filter(Boolean))
      lines.push(`   • ${s}`);
  }

  if (info.service_order) {
    lines.push("");
    lines.push("*Ordem do culto:*");
    lines.push(info.service_order.trim());
  }

  lines.push("");
  lines.push("*Escala:*");
  const byTeam = new Map<string, TemplateAssignment[]>();
  for (const a of ev.assignments) {
    if (!byTeam.has(a.team)) byTeam.set(a.team, []);
    byTeam.get(a.team)!.push(a);
  }
  for (const [team, list] of byTeam) {
    lines.push(`*${team}*`);
    for (const a of list) lines.push(personLine(a));
  }

  if (info.notes) {
    lines.push("");
    lines.push("*Anotações:*");
    lines.push(info.notes.trim());
  }

  return lines.join("\n");
}

/** Fluxo 3 — lembrete individual (privado) para quem está escalado na semana. */
export function buildWeeklyReminder(
  personFirstName: string,
  items: { title: string; date: ISODate; time: string | null; role: string }[],
  confirmUrlByIndex?: string[],
): string {
  const lines: string[] = [];
  lines.push(`Oi, ${personFirstName}! 👋`);
  lines.push("");
  lines.push(
    items.length === 1
      ? "Você está escalado nesta semana:"
      : "Você está escalado nesta semana nos seguintes cultos:",
  );
  lines.push("");
  items.forEach((it, i) => {
    lines.push(`*${it.title}* — ${formatLong(it.date)}`);
    lines.push(`Função: ${it.role}${it.time ? ` • ${formatTime(it.time)}` : ""}`);
    if (confirmUrlByIndex?.[i]) lines.push(`Confirmar: ${confirmUrlByIndex[i]}`);
    lines.push("");
  });
  lines.push("Responda *SIM* para confirmar ou *NÃO* se não puder. Obrigado! 🙏");
  return lines.join("\n");
}

/** Fluxo 1 — aviso no grupo da equipe abrindo o formulário de disponibilidade. */
export function buildAvailabilityRequest(
  teamName: string,
  year: number,
  month: number,
  formUrl: string,
  closesAt?: ISODate | null,
): string {
  const lines: string[] = [];
  lines.push(`*Disponibilidade — ${teamName}*`);
  lines.push("");
  lines.push(
    `Pessoal, já podemos informar a disponibilidade para *${monthLabel(year, month)}*.`,
  );
  lines.push("Marque os cultos em que você pode servir neste link:");
  lines.push(formUrl);
  if (closesAt) {
    lines.push("");
    lines.push(`_Responda até ${formatLong(closesAt)}._`);
  }
  lines.push("");
  lines.push("É rapidinho e ajuda demais na montagem da escala. 🙌");
  return lines.join("\n");
}
