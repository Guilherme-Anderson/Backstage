"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

type NavItem = { href: string; label: string; adminOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/painel", label: "Painel" },
  { href: "/cultos", label: "Cultos" },
  { href: "/equipes", label: "Equipes" },
  { href: "/disponibilidade", label: "Disponibilidade" },
  { href: "/trocas", label: "Trocas" },
  { href: "/config", label: "Configurações", adminOnly: true },
];

export function AppShell({
  isAdmin,
  userName,
  children,
}: {
  isAdmin: boolean;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/painel" className="font-bold tracking-tight text-zinc-900">
              {APP_NAME}
            </Link>
            <nav className="hidden gap-1 md:flex">
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium",
                      active
                        ? "bg-sky-50 text-sky-700"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-500 sm:inline">
              {userName}
            </span>
            <form action="/auth/sair" method="post">
              <button className="text-sm text-zinc-500 hover:text-zinc-900">
                Sair
              </button>
            </form>
            <button
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
        {open ? (
          <nav className="flex flex-col gap-1 border-t border-zinc-100 px-4 py-2 md:hidden">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
