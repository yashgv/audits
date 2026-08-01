import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Wordmark />
      <h1 className="mt-8 text-[64px] font-semibold leading-none tracking-tighter text-gradient">
        404
      </h1>
      <p className="mt-4 max-w-[42ch] text-[14px] leading-relaxed text-muted-foreground">
        That page does not exist, or the case belongs to a different workspace.
      </p>
      <Button asChild className="mt-8">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  );
}
