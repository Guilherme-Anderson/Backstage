import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function SemAcessoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="max-w-sm text-center">
        <div className="text-xl font-bold text-fg">{APP_NAME}</div>
        <h1 className="mt-6 text-lg font-semibold text-fg">
          Sem acesso
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Sua conta não está habilitada como administrador ou coordenador. Fale
          com um administrador do sistema.
        </p>
        <form action="/auth/sair" method="post" className="mt-6">
          <button className="text-sm text-link hover:underline">
            Sair
          </button>
        </form>
        <Link
          href="/entrar"
          className="mt-2 inline-block text-sm text-fg-muted hover:underline"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
