import { APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-2 px-4 py-12">
      <div className="absolute right-3 top-3">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-bold tracking-tight text-fg">
            {APP_NAME}
          </div>
          <div className="text-sm text-fg-muted">Escalas das equipes de mídia</div>
        </div>
        {children}
      </div>
    </div>
  );
}
