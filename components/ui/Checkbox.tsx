"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useId } from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
}

export function Checkbox({ checked, onChange, label, description, error, disabled, id }: CheckboxProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className={cn("flex items-start gap-2.5 text-sm", disabled && "opacity-60")}>
        <input
          id={fieldId}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          className={cn(
            "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-border bg-input text-primary-foreground peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
            error && "border-danger",
          )}
        >
          <Check className={cn("h-3 w-3", checked ? "opacity-100" : "opacity-0")} />
        </span>
        <span>
          <span className="font-medium text-foreground">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
        </span>
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
