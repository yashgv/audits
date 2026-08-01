import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium leading-5 tracking-tight",
  {
    variants: {
      tone: {
        neutral: "border-white/10 bg-white/[0.04] text-muted-foreground",
        primary: "border-primary/25 bg-primary/10 text-primary",
        pass: "border-pass/25 bg-pass/10 text-pass",
        warn: "border-warn/25 bg-warn/10 text-warn",
        fail: "border-fail/25 bg-fail/10 text-fail",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
