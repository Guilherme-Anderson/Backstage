"use client";

import { useActionState } from "react";
import { Field, Input, Textarea, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { saveEventInfo } from "../actions";

type Info = {
  preacher: string | null;
  songs: string | null;
  groups_participations: string | null;
  service_order: string | null;
  notes: string | null;
} | null;

export function EventInfoForm({
  eventId,
  info,
}: {
  eventId: string;
  info: Info;
}) {
  const [state, action] = useActionState(
    saveEventInfo.bind(null, eventId),
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Preletor" htmlFor="preacher">
          <Input id="preacher" name="preacher" defaultValue={info?.preacher ?? ""} />
        </Field>
        <Field label="Grupos / participações" htmlFor="groups_participations">
          <Input
            id="groups_participations"
            name="groups_participations"
            defaultValue={info?.groups_participations ?? ""}
          />
        </Field>
      </div>
      <Field label="Músicas" htmlFor="songs" hint="Uma por linha.">
        <Textarea id="songs" name="songs" defaultValue={info?.songs ?? ""} />
      </Field>
      <Field label="Ordem do culto" htmlFor="service_order">
        <Textarea
          id="service_order"
          name="service_order"
          className="min-h-[120px]"
          defaultValue={info?.service_order ?? ""}
        />
      </Field>
      <Field label="Anotações" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={info?.notes ?? ""} />
      </Field>
      <FormError>{state?.error}</FormError>
      {state?.ok ? <p className="text-sm text-emerald-600">Salvo.</p> : null}
      <SubmitButton>Salvar informações</SubmitButton>
    </form>
  );
}
