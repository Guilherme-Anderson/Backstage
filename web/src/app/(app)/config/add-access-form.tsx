"use client";

import { useActionState } from "react";
import { Field, Input, Select, FormError, FormSuccess } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { addAccess } from "./actions";

export function AddAccessForm() {
  const [state, action] = useActionState(addAccess, null);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nome" htmlFor="a_name">
          <Input id="a_name" name="full_name" required />
        </Field>
        <Field label="E-mail" htmlFor="a_email">
          <Input id="a_email" name="email" type="email" required />
        </Field>
        <Field label="Papel" htmlFor="a_role">
          <Select id="a_role" name="role" defaultValue="coordenador">
            <option value="coordenador">Coordenador</option>
            <option value="admin_geral">Administrador geral</option>
          </Select>
        </Field>
      </div>
      <p className="text-xs text-zinc-500">
        Coordenador ainda precisa ser vinculado a uma equipe na tela de Equipes.
      </p>
      <FormError>{state?.error}</FormError>
      {state?.ok ? <FormSuccess>{state.message}</FormSuccess> : null}
      <SubmitButton size="sm">Adicionar acesso</SubmitButton>
    </form>
  );
}
