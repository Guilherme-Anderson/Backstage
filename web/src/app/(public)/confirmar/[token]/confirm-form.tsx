"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Textarea } from "@/components/ui";

export function ConfirmForm({
  token,
  status,
}: {
  token: string;
  status: "unfilled" | "pending" | "confirmed" | "declined";
}) {
  const [result, setResult] = useState<null | "confirmed" | "declined">(
    status === "confirmed" || status === "declined" ? status : null,
  );
  const [busy, setBusy] = useState<"" | "yes" | "no">("");
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(confirm: boolean) {
    setBusy(confirm ? "yes" : "no");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("confirm_assignment", {
      p_token: token,
      p_confirm: confirm,
      p_reason: confirm ? undefined : reason || undefined,
    });
    setBusy("");
    if (error) {
      setError(error.message);
      return;
    }
    setResult(confirm ? "confirmed" : "declined");
  }

  if (result === "confirmed") {
    return (
      <p className="mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-3 text-sm text-emerald-800 dark:text-emerald-200">
        Presença confirmada. Obrigado! 🙏 Se algo mudar, você pode voltar aqui.
      </p>
    );
  }
  if (result === "declined") {
    return (
      <div className="mt-4 space-y-3">
        <p className="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-3 text-sm text-amber-800 dark:text-amber-200">
          Anotado que você não poderá. O coordenador foi avisado para achar um
          substituto.
        </p>
        <Button variant="secondary" onClick={() => send(true)} disabled={!!busy}>
          Na verdade, posso sim
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {error ? (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button className="flex-1" disabled={!!busy} onClick={() => send(true)}>
          {busy === "yes" ? "…" : "Confirmo"}
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          disabled={!!busy}
          onClick={() => setShowReason((v) => !v)}
        >
          Não vou poder
        </Button>
      </div>
      {showReason ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            variant="danger"
            className="w-full"
            disabled={!!busy}
            onClick={() => send(false)}
          >
            {busy === "no" ? "…" : "Confirmar que não poderei"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
