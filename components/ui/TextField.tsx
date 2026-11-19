"use client";

import { Input, type InputProps } from "@/components/ui/Input";
import { cn, focusRing } from "@/lib/utils";
import { useId, type ReactNode, type TextareaHTMLAttributes } from "react";

interface TextFieldBase {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  id?: string;
}

type TextFieldProps = TextFieldBase &
  (
    | ({ multiline?: false } & InputProps)
    | ({ multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>)
  );

export function TextField(props: TextFieldProps) {
  const autoId = useId();
  const { label, error, helperText, className, id, multiline } = props;
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : helperText ? `${fieldId}-help` : undefined;

  let control: ReactNode;
  if (multiline) {
    const rest = { ...props };
    delete (rest as Partial<TextFieldProps>).label;
    delete (rest as Partial<TextFieldProps>).error;
    delete (rest as Partial<TextFieldProps>).helperText;
    delete (rest as Partial<TextFieldProps>).className;
    delete (rest as Partial<TextFieldProps>).id;
    delete (rest as Partial<TextFieldProps>).multiline;

    control = (
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-28 w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-danger" : "border-border",
          focusRing,
        )}
        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    );
  } else {
    const rest = { ...props };
    delete (rest as Partial<TextFieldProps>).label;
    delete (rest as Partial<TextFieldProps>).error;
    delete (rest as Partial<TextFieldProps>).helperText;
    delete (rest as Partial<TextFieldProps>).className;
    delete (rest as Partial<TextFieldProps>).id;
    delete (rest as Partial<TextFieldProps>).multiline;

    control = (
      <Input
        id={fieldId}
        invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...(rest as InputProps)}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      {control}
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${fieldId}-help`} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
