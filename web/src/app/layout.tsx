import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backstage — Escalas",
  description: "Escalas das equipes de mídia da igreja.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const theme =
    (await cookies()).get("tema")?.value === "light" ? "light" : "dark";
  return (
    <html
      lang="pt-BR"
      data-theme={theme}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg text-fg">{children}</body>
    </html>
  );
}
