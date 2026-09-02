"use client";

import { useActionState } from "react";
import { Input, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { updateWhatsAppTarget } from "./actions";

export function WhatsAppTargetForm({
  target,
}: {
  target: {
    id: string;
    label: string;
    chat_id: string | null;
    active: boolean;
    hint: string;
  };
}) {
  const [state, action] = useActionState(
    updateWhatsAppTarget.bind(null, target.id),
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-fg-soft">
        {target.hint}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-fg-muted">Rótulo</label>
          <Input name="label" defaultValue={target.label} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">
            ID do grupo (…@g.us)
          </label>
          <Input name="chat_id" defaultValue={target.chat_id ?? ""} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-fg">
          <input type="checkbox" name="active" defaultChecked={target.active} />
          Ativo
        </label>
        <SubmitButton size="sm">Salvar</SubmitButton>
      </div>
      {state?.error ? <FormError>{state.error}</FormError> : null}
    </form>
  );
}
