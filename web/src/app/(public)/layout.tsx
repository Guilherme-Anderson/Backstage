import { APP_NAME } from "@/lib/constants";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-surface-2 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center text-lg font-bold tracking-tight text-fg">
          {APP_NAME}
        </div>
        {children}
        <p className="mt-8 text-center text-xs text-fg-soft">
          Equipe {APP_NAME} — mídia da igreja
        </p>
      </div>
    </div>
  );
}
