"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, Field, Input, FormError, FormSuccess } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default function EsqueciSenhaPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") || "").trim();
    const supabase = createClient();
    const origin =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-lg font-semibold text-fg">
        Recuperar senha
      </h1>
      <p className="mb-4 text-sm text-fg-muted">
        Enviaremos um link para você definir uma nova senha.
      </p>
      <form action={onSubmit} className="space-y-4">
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <FormError>{error}</FormError>
        {sent ? (
          <FormSuccess>
            Se este e-mail tiver acesso, o link chegará em instantes.
          </FormSuccess>
        ) : null}
        <SubmitButton className="w-full" pendingText="Enviando…">
          Enviar link
        </SubmitButton>
      </form>
      <div className="mt-4 text-sm">
        <Link href="/entrar" className="text-link hover:underline">
          Voltar para entrar
        </Link>
      </div>
    </Card>
  );
}
