import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza um telefone brasileiro para o formato E.164 (+55DDDNÚMERO).
 * Aceita entradas como "(11) 99999-8888", "11999998888", "+55 11 99999-8888".
 * Retorna null se não parecer um número válido.
 */
export function toE164BR(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let d = digits;
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  // agora esperamos DDD (2) + número (8 ou 9)
  if (d.length !== 10 && d.length !== 11) return null;
  return `+55${d}`;
}

/** Exibe um E.164 brasileiro como "(11) 99999-8888". */
export function formatPhoneBR(e164: string | null | undefined): string {
  if (!e164) return "—";
  const d = e164.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return e164;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
