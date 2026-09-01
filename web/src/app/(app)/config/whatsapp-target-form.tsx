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
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="w-28 shrink-0 pb-2 text-xs font-medium uppercase text-zinc-400">
        {target.hint}
      </div>
      <div className="min-w-[160px] flex-1">
        <label className="mb-1 block text-xs text-zinc-500">Rótulo</label>
        <Input name="label" defaultValue={target.label} />
      </div>
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs text-zinc-500">
          ID do grupo (…@g.us)
        </label>
        <Input name="chat_id" defaultValue={target.chat_id ?? ""} />
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm text-zinc-700">
        <input type="checkbox" name="active" defaultChecked={target.active} />
        Ativo
      </label>
      <SubmitButton size="sm">Salvar</SubmitButton>
      {state?.error ? (
        <div className="w-full">
          <FormError>{state.error}</FormError>
        </div>
      ) : null}
    </form>
  );
}
