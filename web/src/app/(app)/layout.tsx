import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const name =
    session.profile?.full_name || session.email || "Usuário";
  return (
    <AppShell isAdmin={session.isAdmin} userName={name}>
      {children}
    </AppShell>
  );
}
