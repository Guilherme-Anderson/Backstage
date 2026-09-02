"use client";

import { useTransition } from "react";
import Link from "next/link";
import { buttonClass, Button } from "@/components/ui";
import { cancelSwap } from "./actions";

export function SwapRow({
  swapId,
  person,
  role,
  eventTitle,
  eventDate,
  reason,
  eventId,
}: {
  swapId: string;
  person: string;
  role: string;
  eventTitle: string;
  eventDate: string;
  reason: string | null;
  eventId: string | null;
}) {
  const [pending, start] = useTransition();
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div>
        <div className="font-medium text-fg">
          {person} · {role}
        </div>
        <div className="text-sm text-fg-muted">
          {eventTitle} — {eventDate}
          {reason ? ` · “${reason}”` : ""}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {eventId ? (
          <Link
            href={`/cultos/${eventId}/escala`}
            className={buttonClass("primary", "sm")}
          >
            Achar substituto
          </Link>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (confirm("Marcar esta troca como resolvida por fora / cancelada?"))
              start(() => cancelSwap(swapId));
          }}
        >
          Cancelar
        </Button>
      </div>
    </li>
  );
}
