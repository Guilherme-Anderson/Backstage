"use client";

import { useActionState } from "react";
import { Field, Input, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { saveTemplate } from "./actions";

export function TemplateForm({
  template,
  teams,
}: {
  template: {
    id: string;
    name: string;
    default_start_time: string | null;
    active: boolean;
    teamIds: string[];
  };
  teams: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(
    saveTemplate.bind(null, template.id),
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <Field label="Nome" htmlFor={`n-${template.id}`}>
        <Input
          id={`n-${template.id}`}
          name="name"
          defaultValue={template.name}
          required
        />
      </Field>
      <Field label="Horário padrão" htmlFor={`t-${template.id}`}>
        <Input
          id={`t-${template.id}`}
          name="default_start_time"
          type="time"
          defaultValue={template.default_start_time?.slice(0, 5) ?? ""}
        />
      </Field>
      <div>
        <span className="mb-1 block text-sm font-medium text-fg">
          Equipes
        </span>
        <div className="flex flex-wrap gap-2">
          {teams.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-sm"
            >
              <input
                type="checkbox"
                name="team_ids"
                value={t.id}
                defaultChecked={template.teamIds.includes(t.id)}
              />
              {t.name}
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-fg">
        <input type="checkbox" name="active" defaultChecked={template.active} />
        Ativa
      </label>
      <FormError>{state?.error}</FormError>
      {state?.ok ? <p className="text-sm text-emerald-600 dark:text-emerald-400">Salvo.</p> : null}
      <SubmitButton size="sm">Salvar</SubmitButton>
    </form>
  );
}
