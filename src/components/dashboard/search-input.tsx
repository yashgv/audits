"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

export function SearchInput({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const q = value.trim();
      startTransition(() => {
        router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname);
      });
    }, 260);
    return () => clearTimeout(timer);
  }, [value, pathname, router]);

  return (
    <div className="relative w-full sm:max-w-[320px]">
      {pending ? (
        <Loader2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search cases, vendors, references…"
        className="h-10 w-full rounded-md border border-input bg-white/[0.02] pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
      />
    </div>
  );
}
