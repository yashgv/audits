"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Wordmark />
      <h1 className="mt-8 text-[28px] font-semibold tracking-tighter">Something broke</h1>
      <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-muted-foreground">
        The workspace hit an unexpected error. Nothing was lost — retry the last action.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11.5px] text-muted-foreground/70">
          ref {error.digest}
        </p>
      ) : null}
      <Button className="mt-8" onClick={reset}>
        <RotateCcw />
        Try again
      </Button>
    </main>
  );
}
