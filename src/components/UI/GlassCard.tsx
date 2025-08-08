import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-lg border p-4 transition-shadow",
        "hover:shadow-[var(--shadow-glow)]",
        className
      )}
      {...props}
    />
  );
}
