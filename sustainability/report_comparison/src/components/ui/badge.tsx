import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "muted" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-chip text-ink": variant === "default",
          "bg-chip text-good": variant === "success",
          "bg-chip text-accent": variant === "warning",
          "bg-chip text-muted": variant === "muted",
          "border border-hairline text-body bg-card": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
