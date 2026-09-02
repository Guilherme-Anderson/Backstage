"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, Field, Input, FormError, FormSuccess } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default function CriarAcessoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setNeedsEmail(false);
    const email = String(formData.get("email") || "").trim();
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
    const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setError(
        /não autorizado|not authorized/i.test(error.message)
          ? "Este e-mail ainda não foi cadastrado por um administrador."
          : error.message,
      );
      return;
    }
    if (data.session) {
      router.replace("/painel");
      router.refresh();
    } else {
      setNeedsEmail(true);
    }
  }

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-lg font-semibold text-fg">Primeiro acesso</h1>
      <p className="mb-4 text-sm text-fg-muted">
        Use o e-mail que o administrador cadastrou e defina sua senha.
      </p>
      <form action={onSubmit} className="space-y-4">
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Senha" htmlFor="password" hint="Mínimo de 8 caracteres.">
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
        {needsEmail ? (
          <FormSuccess>
            Enviamos um e-mail de confirmação. Abra o link para ativar seu acesso.
          </FormSuccess>
        ) : null}
        <SubmitButton className="w-full" pendingText="Criando…">
          Criar acesso
        </SubmitButton>
      </form>
      <div className="mt-4 text-sm">
        <Link href="/entrar" className="text-link hover:underline">
          Já tenho acesso
        </Link>
      </div>
    </Card>
  );
}
