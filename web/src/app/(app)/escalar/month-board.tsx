"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, Badge, Button, EmptyState, buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatLong, formatTime } from "@/lib/dates";
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
    status: Database["public"]["Enums"]["assignment_status"];
  }[];
  candidates: {
    id: string;
    name: string;
    avail: Availability;
    busy: string[];
  }[];
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
}: {
  teams: { id: string; name: string }[];
  teamId: string;
  teamName: string;
  year: number;
  month: number;
  monthLabel: string;
  events: BoardEvent[];
  cycleStatus: "open" | "closed" | null;
}) {
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});
  const [hideUnavailable, setHideUnavailable] = useState(false);
  const [, startTransition] = useTransition();

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const href = (q: Record<string, string | number>) => {
    const p = new URLSearchParams({
      equipe: teamId,
      ano: String(year),
      mes: String(month),
      ...Object.fromEntries(Object.entries(q).map(([k, v]) => [k, String(v)])),
    });
    return `/escalar?${p.toString()}`;
  };

  const currentFor = (slot: BoardEvent["slots"][number]) =>
    slot.assignmentId in overrides
      ? overrides[slot.assignmentId]
      : slot.currentUserId;

  function choose(assignmentId: string, userId: string | null) {
    setOverrides((o) => ({ ...o, [assignmentId]: userId }));
    startTransition(() => {
      assignSlot(assignmentId, userId).catch(() => {
        setOverrides((o) => {
          const c = { ...o };
          delete c[assignmentId];
          return c;
        });
      });
    });
  }

  let liveOpen = 0;
  for (const ev of events)
    for (const s of ev.slots) if (!currentFor(s)) liveOpen++;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-fg">Montar escala</h1>
        <p className="text-sm text-fg-muted">
          Escolha a equipe e o mês. Clique num nome para preencher a vaga; clique
          de novo para tirar.
        </p>
      </div>

      {/* controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {teams.map((t) => (
            <Link
              key={t.id}
              href={href({ equipe: t.id, ano: year, mes: month })}
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
          {teamName} ·{" "}
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
          Não há ciclo de disponibilidade para {monthLabel} nesta equipe — os
          nomes aparecem sem marcação.{" "}
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
        <div className="space-y-4">
          {events.map((ev) => {
            const filled = ev.slots.filter((s) => currentFor(s)).length;
            return (
              <Card key={ev.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft px-5 py-3">
                  <div>
                    <div className="font-semibold text-fg">
                      {ev.title}
                      {ev.kind === "extra" ? (
                        <Badge tone="sky" className="ml-2">
                          Extra
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-xs capitalize text-fg-muted">
                      {formatLong(ev.date)}
                      {ev.time ? ` • ${formatTime(ev.time)}` : ""}
                    </div>
                  </div>
                  {filled === ev.slots.length && ev.slots.length > 0 ? (
                    <Badge tone="green">Completo</Badge>
                  ) : (
                    <Badge tone="amber">
                      {filled}/{ev.slots.length}
                    </Badge>
                  )}
                </div>

                <div className="divide-y divide-border-soft">
                  {ev.slots.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-fg-soft">
                      Sem funções ativas nesta equipe.
                    </p>
                  ) : (
                    ev.slots.map((slot) => {
                      const current = currentFor(slot);
                      return (
                        <div key={slot.assignmentId} className="px-5 py-3">
                          <div className="mb-2 text-sm font-medium text-fg">
                            {slot.roleName}
                            {current ? null : (
                              <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
                                em aberto
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {ev.candidates
                              .filter(
                                (c) =>
                                  !hideUnavailable ||
                                  c.avail !== "no" ||
                                  c.id === current,
                              )
                              .map((c) => {
                                const isCurrent = c.id === current;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() =>
                                      choose(
                                        slot.assignmentId,
                                        isCurrent ? null : c.id,
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
                                    {isCurrent ? (
                                      <span aria-hidden>×</span>
                                    ) : null}
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
