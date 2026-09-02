"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { generateRecurring } from "./actions";

export function GenerateRecurringButton({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {msg ? <span className="text-xs text-emerald-600 dark:text-emerald-400">{msg}</span> : null}
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            await generateRecurring(year, month);
            setMsg("Cultos gerados.");
          })
        }
      >
        {pending ? "Gerando…" : "Gerar cultos recorrentes"}
      </Button>
    </div>
  );
}
