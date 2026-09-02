"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, Badge, Button, EmptyState, buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatShort, formatTime } from "@/lib/dates";
import type { Database } from "@/lib/database.types";
import { assignSlot, generateMonth } from "./actions";

export type Availability = "yes" | "no" | "unknown";

export type BoardEvent = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  kind: Database["public"]["Enums"]["event_kind"];
  slots: {
    assignmentId: string;
    roleName: string;
    roleSort: number;
    currentUserId: string | null;
    currentUserName: string | null;
    status: Database["public"]["Enums"]["assignment_status"];
  }[];
  candidates: { id: string; name: string; avail: Availability; busy: string[] }[];
};

const dot: Record<Availability, string> = {
  yes: "bg-emerald-500",
  no: "bg-red-500",
  unknown: "bg-fg-soft",
};

export function MonthBoard({
  teams,
  teamId,
  teamName,
  year,
  month,
  monthLabel,
  events,
  cycleStatus,
  responderCount,
}: {
  teams: { id: string; name: string }[];
  teamId: string;
  teamName: string;
  year: number;
  month: number;
  monthLabel: string;
  events: BoardEvent[];
  cycleStatus: "open" | "closed" | null;
  responderCount: number;
}) {
  const [overrides, setOverrides] = useState<
    Record<string, { id: string; name: string } | null>
  >({});
  const [hideUnavailable, setHideUnavailable] = useState(true);
  const [, startTransition] = useTransition();

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const href = (q: Record<string, string | number>) => {
    const p = new URLSearchParams({
      equipe: teamId,
      ano: String(year),
      mes: String(month),
      ...Object.fromEntries(
        Object.entries(q).map(([k, v]) => [k, String(v)]),
      ),
    });
    return `/escalar?${p.toString()}`;
  };

  const pick = (slot: BoardEvent["slots"][number]) => {
    if (slot.assignmentId in overrides) return overrides[slot.assignmentId];
    return slot.currentUserId
      ? { id: slot.currentUserId, name: slot.currentUserName ?? "—" }
      : null;
  };

  function choose(
    assignmentId: string,
    person: { id: string; name: string } | null,
  ) {
    setOverrides((o) => ({ ...o, [assignmentId]: person }));
    startTransition(() => {
      assignSlot(assignmentId, person?.id ?? null).catch(() => {
        setOverrides((o) => {
          const c = { ...o };
          delete c[assignmentId];
          return c;
        });
      });
    });
  }

  let liveOpen = 0;
  for (const ev of events) for (const s of ev.slots) if (!pick(s)) liveOpen++;

  const singleRole = events.every((e) => e.slots.length <= 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-fg">Montar escala</h1>
        <p className="text-sm text-fg-muted">
          Só aparece quem informou disponibilidade da equipe no mês. Clique num
          nome para preencher; clique de novo para tirar. Domingo de manhã já
          preenche a noite.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {teams.map((t) => (
            <Link
              key={t.id}
              href={href({ equipe: t.id })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                t.id === teamId
                  ? "bg-accent text-accent-contrast"
                  : "bg-surface-2 text-fg-muted hover:text-fg",
              )}
            >
              {t.name}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Link
            href={href({ ano: prev.y, mes: prev.m })}
            className={buttonClass("secondary", "sm")}
          >
            ←
          </Link>
          <span className="min-w-[9rem] text-center text-sm font-medium capitalize text-fg">
            {monthLabel}
          </span>
          <Link
            href={href({ ano: next.y, mes: next.m })}
            className={buttonClass("secondary", "sm")}
          >
            →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-fg-muted">
          {teamName} · {responderCount} responderam ·{" "}
          {liveOpen === 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              tudo escalado
            </span>
          ) : (
            <span className="text-fg">{liveOpen} vaga(s) em aberto</span>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          <input
            type="checkbox"
            checked={hideUnavailable}
            onChange={(e) => setHideUnavailable(e.target.checked)}
          />
          Esconder quem marcou indisponível
        </label>
      </div>

      {cycleStatus === null ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          Não há ciclo de disponibilidade para {monthLabel} nesta equipe — a
          lista mostra todos os membros.{" "}
          <Link href="/disponibilidade" className="underline">
            Abrir ciclo
          </Link>
        </p>
      ) : null}

      {events.length === 0 ? (
        <Card>
          <EmptyState>
            Nenhum culto de {teamName} em {monthLabel}.
            <div className="mt-3">
              <GenerateButton year={year} month={month} />
            </div>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((ev) => {
            const filled = ev.slots.filter((s) => pick(s)).length;
            const complete = filled === ev.slots.length && ev.slots.length > 0;
            return (
              <Card key={ev.id} className="flex flex-col overflow-hidden">
                <div className="border-b border-border-soft px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-fg">
                        {ev.title}
                        {ev.kind === "extra" ? (
                          <Badge tone="sky" className="ml-2">
                            Extra
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-fg-muted">
                        {formatShort(ev.date)}
                        {ev.time ? ` • ${formatTime(ev.time)}` : ""}
                      </div>
                    </div>
                    <Badge tone={complete ? "green" : "amber"}>
                      {complete ? "Completo" : `${filled}/${ev.slots.length}`}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-0.5 text-sm">
                    {ev.slots.map((slot) => {
                      const p = pick(slot);
                      return (
                        <div key={slot.assignmentId} className="flex gap-1.5">
                          {!singleRole ? (
                            <span className="text-fg-muted">
                              {slot.roleName}:
                            </span>
                          ) : null}
                          {p ? (
                            <span className="font-medium text-fg">{p.name}</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                              em aberto
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="divide-y divide-border-soft">
                  {ev.slots.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-fg-soft">
                      Sem funções ativas nesta equipe.
                    </p>
                  ) : (
                    ev.slots.map((slot) => {
                      const p = pick(slot);
                      const visible = ev.candidates.filter(
                        (c) =>
                          !hideUnavailable ||
                          c.avail !== "no" ||
                          c.id === p?.id,
                      );
                      return (
                        <div key={slot.assignmentId} className="px-4 py-3">
                          {!singleRole ? (
                            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-soft">
                              {slot.roleName}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-1.5">
                            {visible.length === 0 ? (
                              <span className="text-xs text-fg-soft">
                                Ninguém disponível.
                              </span>
                            ) : null}
                            {visible.map((c) => {
                              const isCurrent = c.id === p?.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() =>
                                    choose(
                                      slot.assignmentId,
                                      isCurrent
                                        ? null
                                        : { id: c.id, name: c.name },
                                    )
                                  }
                                  title={
                                    c.busy.length
                                      ? `Já escalado neste dia: ${c.busy.join(", ")}`
                                      : undefined
                                  }
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                                    isCurrent
                                      ? "border-accent bg-accent text-accent-contrast"
                                      : "border-border bg-surface text-fg hover:border-accent hover:bg-accent-soft",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      isCurrent ? "bg-white/80" : dot[c.avail],
                                    )}
                                  />
                                  {c.name}
                                  {c.busy.length && !isCurrent ? (
                                    <span className="text-amber-500" aria-hidden>
                                      •
                                    </span>
                                  ) : null}
                                  {isCurrent ? <span aria-hidden>×</span> : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> disponível
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-fg-soft" /> sem resposta
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> indisponível
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-amber-500">•</span> já escalado neste dia
        </span>
      </p>
    </div>
  );
}

function GenerateButton({ year, month }: { year: number; month: number }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => start(() => generateMonth(year, month))}
    >
      {pending ? "Gerando…" : "Gerar cultos recorrentes deste mês"}
    </Button>
  );
}
