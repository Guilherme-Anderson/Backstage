import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ----------------------------- Button ----------------------------- */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-surface text-fg border border-border hover:bg-surface-2",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button className={buttonClass(variant, size, className)} {...props} />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

/* ----------------------------- Inputs ----------------------------- */
export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg placeholder:text-fg-soft focus:border-accent focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[80px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-soft focus:border-accent focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-sm font-medium text-fg", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-fg-muted">{hint}</p> : null}
    </div>
  );
}

/* ----------------------------- Card ------------------------------- */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border-soft px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div>
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ----------------------------- Badge ----------------------------- */
const badgeTones = {
  neutral: "bg-surface-2 text-fg",
  amber: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200",
  green: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200",
  red: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300",
  sky: "bg-accent-soft text-accent-soft-fg",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof badgeTones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------- Alert box --------------------------- */
export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
      {children}
    </p>
  );
}

export function FormSuccess({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
      {children}
    </p>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-fg-muted">{children}</div>
  );
}
