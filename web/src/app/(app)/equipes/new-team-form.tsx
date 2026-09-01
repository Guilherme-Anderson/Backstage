"use client";

import { useActionState } from "react";
import { Field, Input, Textarea, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createTeam } from "./actions";

export function NewTeamForm() {
  const [state, action] = useActionState(createTeam, null);
  return (
    <form action={action} className="space-y-4">
      <Field label="Nome" htmlFor="name">
        <Input id="name" name="name" required placeholder="Ex.: Iluminação" />
      </Field>
      <Field label="Descrição" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          placeholder="O que essa equipe faz"
        />
      </Field>
      <FormError>{state?.error}</FormError>
      <SubmitButton>Criar equipe</SubmitButton>
    </form>
  );
}
