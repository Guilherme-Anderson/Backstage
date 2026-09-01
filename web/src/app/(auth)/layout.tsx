import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-bold tracking-tight text-zinc-900">
            {APP_NAME}
          </div>
          <div className="text-sm text-zinc-500">Escalas das equipes de mídia</div>
        </div>
        {children}
      </div>
    </div>
  );
}
