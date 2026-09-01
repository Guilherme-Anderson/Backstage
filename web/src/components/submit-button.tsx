"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import * as React from "react";

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending || props.disabled}
      aria-busy={pending}
      {...props}
    >
      {pending ? (pendingText ?? "Salvando…") : children}
    </Button>
  );
}
