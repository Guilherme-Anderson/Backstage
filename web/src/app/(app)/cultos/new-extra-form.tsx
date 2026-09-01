"use client";

import { useActionState } from "react";
import { Field, Input, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createExtraEvent } from "./actions";

export function NewExtraEventForm({
  teams,
  defaultDate,
}: {
  teams: { id: string; name: string }[];
  defaultDate: string;
}) {
  const [state, action] = useActionState(createExtraEvent, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nome do evento" htmlFor="title">
          <Input id="title" name="title" required placeholder="Ex.: Natal" />
        </Field>
        <Field label="Data" htmlFor="event_date">
          <Input
            id="event_date"
            name="event_date"
            type="date"
            defaultValue={defaultDate}
            required
          />
        </Field>
        <Field label="Horário" htmlFor="start_time">
          <Input id="start_time" name="start_time" type="time" />
        </Field>
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Equipes participantes
        </span>
        <div className="flex flex-wrap gap-3">
          {teams.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <input type="checkbox" name="team_ids" value={t.id} />
              {t.name}
            </label>
          ))}
        </div>
      </div>
      <FormError>{state?.error}</FormError>
      <SubmitButton>Criar evento</SubmitButton>
    </form>
  );
}
