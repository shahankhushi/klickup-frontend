"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  error?: string;
  className?: string;
}

export function RadioGroup({ label, name, value, onChange, options, error, className }: RadioGroupProps) {
  const autoId = useId();
  const groupName = name ?? autoId;

  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      {label && <legend className="mb-1 text-sm font-medium text-foreground">{label}</legend>}
      {options.map((option) => {
        const id = `${groupName}-${option.value}`;
        const selected = value === option.value;
        return (
          <label key={option.value} htmlFor={id} className="flex items-start gap-2.5 text-sm">
            <input
              id={id}
              type="radio"
              name={groupName}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border bg-input peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
              <span className={cn("h-2 w-2 rounded-full bg-primary", selected ? "opacity-100" : "opacity-0")} />
            </span>
            <span>
              <span className="font-medium text-foreground">{option.label}</span>
              {option.description && (
                <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
              )}
            </span>
          </label>
        );
      })}
      {error && <p className="text-xs text-danger">{error}</p>}
    </fieldset>
  );
}
