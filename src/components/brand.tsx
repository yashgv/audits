import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-7", className)} aria-hidden>
      <defs>
        <linearGradient id="vt-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(200 90% 62%)" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5 27 7v8.6c0 6.6-4.4 11.6-11 13.9-6.6-2.3-11-7.3-11-13.9V7L16 2.5Z"
        fill="url(#vt-g)"
        fillOpacity="0.16"
        stroke="url(#vt-g)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m11 15.6 3.6 3.6L21.5 12"
        stroke="url(#vt-g)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Logo />
      <span className="text-[15px] font-semibold tracking-tight">Veritas</span>
    </span>
  );
}
