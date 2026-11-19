"use client";

import { cn, focusRing } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border bg-input px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
        invalid ? "border-danger" : "border-border",
        focusRing,
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
