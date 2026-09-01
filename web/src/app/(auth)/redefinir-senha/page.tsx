"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, Field, Input, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
    });
  }, []);

  async function onSubmit(formData: FormData) {
    setError(null);
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/painel");
    router.refresh();
  }

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-lg font-semibold text-zinc-900">Nova senha</h1>
      {!ready ? (
        <p className="text-sm text-zinc-500">
          Abra esta página pelo link enviado no seu e-mail. Se já abriu e continua
          vendo isto, o link pode ter expirado —{" "}
          <Link href="/esqueci-senha" className="text-sky-600 hover:underline">
            peça um novo
          </Link>
          .
        </p>
      ) : (
        <form action={onSubmit} className="space-y-4">
          <Field label="Nova senha" htmlFor="password" hint="Mínimo de 8 caracteres.">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Repita a senha" htmlFor="confirm">
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>
          <FormError>{error}</FormError>
          <SubmitButton className="w-full">Salvar senha</SubmitButton>
        </form>
      )}
    </Card>
  );
}
