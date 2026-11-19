"use client";

import { formatDateTime, formatRelative } from "@/lib/utils";
import { useEffect, useState } from "react";

export function RelativeTime({ value, className }: { value: string; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const text = mounted ? formatRelative(value) : formatDateTime(value);

  return (
    <time dateTime={value} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
