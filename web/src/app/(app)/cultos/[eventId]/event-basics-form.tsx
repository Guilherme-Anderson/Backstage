"use client";

import { useActionState } from "react";
import { Field, Input, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { updateEventBasics } from "../actions";

export function EventBasicsForm({
  eventId,
  title,
  date,
  time,
}: {
  eventId: string;
  title: string;
  date: string;
  time: string | null;
}) {
  const [state, action] = useActionState(
    updateEventBasics.bind(null, eventId),
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <Field label="Nome" htmlFor="e_title">
        <Input id="e_title" name="title" defaultValue={title} required />
      </Field>
      <Field label="Data" htmlFor="e_date">
        <Input
          id="e_date"
          name="event_date"
          type="date"
          defaultValue={date}
          required
        />
      </Field>
      <Field label="Horário" htmlFor="e_time">
        <Input
          id="e_time"
          name="start_time"
          type="time"
          defaultValue={time?.slice(0, 5) ?? ""}
        />
      </Field>
      <FormError>{state?.error}</FormError>
      {state?.ok ? <p className="text-sm text-emerald-600">Salvo.</p> : null}
      <SubmitButton size="sm">Salvar</SubmitButton>
    </form>
  );
}
