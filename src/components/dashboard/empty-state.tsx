"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { seedDemoCasesAction } from "@/app/actions/investigations";

export function EmptyState() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const seed = () =>
    startTransition(async () => {
      const result = await seedDemoCasesAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Three sample cases generated");
      router.refresh();
    });

  return (
    <div className="glass noise flex flex-col items-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
        <FolderOpen className="size-5 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-[17px] font-medium tracking-tight">No cases yet</h3>
      <p className="mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-muted-foreground">
        Open a case, drop in the documents you want reconciled, and Veritas returns the
        exceptions with evidence attached.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/investigations/new">Create investigation</Link>
        </Button>
        <Button variant="secondary" onClick={seed} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Generate sample cases
        </Button>
      </div>
    </div>
  );
}
