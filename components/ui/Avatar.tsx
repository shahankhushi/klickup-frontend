import { cn, initialsFrom } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg";

interface AvatarProps {
  name: string;
  initials?: string;
  src?: string | null;
  color?: string;
  size?: AvatarSize;
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function Avatar({ name, initials, src, color = "#6d28d9", size = "md", className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full bg-cover bg-center font-medium text-white shadow-2xs select-none",
        sizes[size],
        className,
      )}
      style={{
        backgroundColor: src ? undefined : color,
        backgroundImage: src ? `url("${src}")` : undefined,
      }}
    >
      {src ? <span className="sr-only">{name}</span> : (initials || initialsFrom(name))}
    </span>
  );
}
