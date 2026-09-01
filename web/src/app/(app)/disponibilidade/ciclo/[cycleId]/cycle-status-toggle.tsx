"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { setCycleStatus } from "../../actions";

export function CycleStatusToggle({
  cycleId,
  status,
}: {
  cycleId: string;
  status: "open" | "closed";
}) {
  const [pending, start] = useTransition();
  const next = status === "open" ? "closed" : "open";
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => start(() => setCycleStatus(cycleId, next))}
    >
      {status === "open" ? "Fechar ciclo" : "Reabrir ciclo"}
    </Button>
  );
}
