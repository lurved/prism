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
          "bg-brand-100 text-brand-800": variant === "default",
          "bg-emerald-100 text-emerald-800": variant === "success",
          "bg-amber-100 text-amber-800": variant === "warning",
          "bg-slate-100 text-slate-600": variant === "muted",
          "border border-slate-200 text-slate-700 bg-white": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
