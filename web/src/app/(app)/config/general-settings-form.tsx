"use client";

import { useActionState } from "react";
import { Field, Input, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { saveGeneralSettings } from "./actions";

export function GeneralSettingsForm({
  values,
}: {
  values: {
    public_base_url: string;
    cron_request_availability_enabled: boolean;
    cron_weekly_reminders_enabled: boolean;
    cron_event_summary_enabled: boolean;
  };
}) {
  const [state, action] = useActionState(saveGeneralSettings, null);
  return (
    <form action={action} className="space-y-4">
      <Field
        label="URL pública do app"
        htmlFor="public_base_url"
        hint="Ex.: https://backstage.vercel.app — usada nos links enviados no WhatsApp (leva 2)."
      >
        <Input
          id="public_base_url"
          name="public_base_url"
          defaultValue={values.public_base_url}
          placeholder="https://..."
        />
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">
          Disparos automáticos (leva 2)
        </legend>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="cron_request_availability_enabled"
            defaultChecked={values.cron_request_availability_enabled}
          />
          Pedido mensal de disponibilidade
        </label>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="cron_weekly_reminders_enabled"
            defaultChecked={values.cron_weekly_reminders_enabled}
          />
          Lembrete semanal individual
        </label>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="cron_event_summary_enabled"
            defaultChecked={values.cron_event_summary_enabled}
          />
          Resumo do culto (D-1)
        </label>
      </fieldset>
      <FormError>{state?.error}</FormError>
      {state?.ok ? <p className="text-sm text-emerald-600 dark:text-emerald-400">Salvo.</p> : null}
      <SubmitButton size="sm">Salvar</SubmitButton>
    </form>
  );
}
