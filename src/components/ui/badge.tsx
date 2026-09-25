import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/30",
        emerald:
          "border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/30",
        amber:
          "border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-500/30",
        rose:
          "border-transparent bg-rose-500/15 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-500/30",
        secondary:
          "border-transparent bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300",
        outline:
          "text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
