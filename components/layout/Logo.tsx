import { cn } from "@/lib/utils";

export function Logo({
  compact = false,
  light = false,
  className,
}: {
  compact?: boolean;
  light?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-bold tracking-tight select-none",
        light ? "text-primary-foreground" : "text-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "relative grid h-8 w-8 place-items-center rounded-xl shadow-md transition-transform hover:scale-105",
          light
            ? "bg-white/20 text-white"
            : "bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 text-white shadow-violet-500/20",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="m4 13 5 5L20 6" />
        </svg>
      </span>
      {!compact && (
        <span className="text-base tracking-tight font-extrabold flex items-center">
          <span className={light ? "text-white" : "text-foreground"}>Klick</span>
          <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            Up
          </span>
        </span>
      )}
    </span>
  );
}
