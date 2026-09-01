import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backstage — Escalas",
  description: "Escalas das equipes de mídia da igreja.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
