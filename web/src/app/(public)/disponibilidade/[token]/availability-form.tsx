"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { formatLong } from "@/lib/dates";

export type FormDate = {
  service_date: string;
  block: "wednesday" | "sunday";
  available: boolean;
};

const BLOCK_LABEL: Record<FormDate["block"], string> = {
  wednesday: "Quarta-feira",
  sunday: "Domingo (manhã + noite)",
};

export function AvailabilityForm({
  token,
  dates,
  readOnly,
  alreadySubmitted,
}: {
  token: string;
  dates: FormDate[];
  readOnly: boolean;
  alreadySubmitted: boolean;
}) {
  const initial = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const d of dates) m[`${d.service_date}|${d.block}`] = d.available;
    return m;
  }, [dates]);

  const [values, setValues] = useState<Record<string, boolean>>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setStatus("saving");
    setError(null);
    const supabase = createClient();
    const payload = dates.map((d) => ({
      service_date: d.service_date,
      block: d.block,
      available: Boolean(values[`${d.service_date}|${d.block}`]),
    }));
    const { error } = await supabase.rpc("submit_availability", {
      p_token: token,
      p_dates: payload,
    });
    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (dates.length === 0) {
    return (
      <p className="mt-4 text-sm text-fg-muted">
        Não há cultos fixos para você neste mês.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <ul className="divide-y divide-border-soft rounded-lg border border-border">
        {dates.map((d) => {
          const key = `${d.service_date}|${d.block}`;
          const on = Boolean(values[key]);
          return (
            <li
              key={key}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium capitalize text-fg">
                  {formatLong(d.service_date)}
                </div>
                <div className="text-xs text-fg-muted">{BLOCK_LABEL[d.block]}</div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setValues((v) => ({ ...v, [key]: true }))}
                  className={`h-8 rounded-md px-3 text-sm font-medium ${
                    on
                      ? "bg-emerald-600 text-white"
                      : "bg-surface-2 text-fg-muted"
                  }`}
                >
                  Posso
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setValues((v) => ({ ...v, [key]: false }))}
                  className={`h-8 rounded-md px-3 text-sm font-medium ${
                    !on ? "bg-red-500 text-white" : "bg-surface-2 text-fg-muted"
                  }`}
                >
                  Não
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {status === "done" ? (
        <p className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Recebido! Você pode reabrir este link e alterar enquanto o período
          estiver aberto.
        </p>
      ) : null}

      {!readOnly ? (
        <Button
          className="w-full"
          disabled={status === "saving"}
          onClick={submit}
        >
          {status === "saving"
            ? "Enviando…"
            : alreadySubmitted || status === "done"
              ? "Atualizar resposta"
              : "Enviar"}
        </Button>
      ) : null}
    </div>
  );
}
