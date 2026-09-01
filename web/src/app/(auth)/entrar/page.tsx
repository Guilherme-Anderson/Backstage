"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, Field, Input, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

function EntrarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const proximo = params.get("proximo") || "/painel";
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
      );
      return;
    }
    router.replace(proximo);
    router.refresh();
  }

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-lg font-semibold text-zinc-900">Entrar</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Acesso para administradores e coordenadores.
      </p>
      <form action={onSubmit} className="space-y-4">
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Senha" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <FormError>{error}</FormError>
        <SubmitButton className="w-full" pendingText="Entrando…">
          Entrar
        </SubmitButton>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/esqueci-senha" className="text-sky-600 hover:underline">
          Esqueci a senha
        </Link>
        <Link href="/criar-acesso" className="text-sky-600 hover:underline">
          Primeiro acesso
        </Link>
      </div>
    </Card>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={null}>
      <EntrarForm />
    </Suspense>
  );
}
