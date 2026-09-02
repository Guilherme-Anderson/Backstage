/**
 * Utilidades de data. Cultos são valores "date" (sem hora/fuso).
 * Representamos internamente como string "YYYY-MM-DD" para evitar
 * qualquer deslocamento de fuso.
 */

export const APP_TZ = "America/Sao_Paulo";

const WEEKDAY_LONG = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export type ISODate = string; // "YYYY-MM-DD"

/** Data de hoje (no fuso do app) como "YYYY-MM-DD". */
export function todayISO(now: Date = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // en-CA já entrega "YYYY-MM-DD"
}

/** { year, month } (month 1-12) do mês seguinte ao de referência. */
export function nextMonth(ref: ISODate = todayISO()): {
  year: number;
  month: number;
} {
  const [y, m] = ref.split("-").map(Number);
  return m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
}

export function currentYearMonth(ref: ISODate = todayISO()): {
  year: number;
  month: number;
} {
  const [y, m] = ref.split("-").map(Number);
  return { year: y, month: m };
}

/**
 * Mês "alvo" para montar escala: a partir do dia 15, já assume o mês seguinte
 * (a essa altura a disponibilidade normalmente já foi coletada).
 */
export function schedulingYearMonth(ref: ISODate = todayISO()): {
  year: number;
  month: number;
} {
  const day = Number(ref.split("-")[2]);
  return day >= 15 ? nextMonth(ref) : currentYearMonth(ref);
}

/** Número de dias no mês (month 1-12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Dia da semana (0=domingo … 6=sábado) de uma "YYYY-MM-DD". */
export function weekdayOf(iso: ISODate): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Todas as datas "YYYY-MM-DD" de um mês que caem em `weekday`. */
export function datesOfMonthByWeekday(
  year: number,
  month: number,
  weekday: number,
): ISODate[] {
  const out: ISODate[] = [];
  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day++) {
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (dow === weekday) {
      out.push(
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      );
    }
  }
  return out;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTHS[month - 1]} de ${year}`;
}

/** "qua, 01/10" */
export function formatShort(iso: ISODate): string {
  const [, m, d] = iso.split("-");
  return `${WEEKDAY_SHORT[weekdayOf(iso)]}, ${d}/${m}`;
}

/** "quarta-feira, 1 de outubro de 2026" */
export function formatLong(iso: ISODate): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${WEEKDAY_LONG[weekdayOf(iso)]}, ${d} de ${MONTHS[m - 1]} de ${y}`;
}

/** "01/10/2026" */
export function formatBR(iso: ISODate): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "19:30" a partir de "19:30:00" (ou null). */
export function formatTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.slice(0, 5);
}

export function isSameOrAfter(a: ISODate, b: ISODate): boolean {
  return a >= b;
}

/** Início (segunda) e fim (domingo) da semana ISO que contém `iso`. */
export function weekRange(iso: ISODate): { start: ISODate; end: ISODate } {
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const dow = base.getUTCDay(); // 0..6
  const deltaToMonday = dow === 0 ? -6 : 1 - dow;
  const start = new Date(base);
  start.setUTCDate(base.getUTCDate() + deltaToMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const fmt = (dt: Date) =>
    `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
      dt.getUTCDate(),
    ).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
}

export { WEEKDAY_LONG, WEEKDAY_SHORT, MONTHS };
