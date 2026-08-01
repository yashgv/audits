"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Loader2, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildMarkdownReport, reportFileName } from "@/lib/report";
import { deleteInvestigationAction } from "@/app/actions/investigations";
import type { InvestigationRecord } from "@/lib/types";

export function ReportActions({ record }: { record: InvestigationRecord }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const download = () => {
    const blob = new Blob([buildMarkdownReport(record)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = reportFileName(record);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdownReport(record));
      setCopied(true);
      toast.success("Report copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard is blocked in this browser — use Download instead");
    }
  };

  const archive = () =>
    startTransition(async () => {
      const result = await deleteInvestigationAction(record.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Case archived");
      router.push("/dashboard");
      router.refresh();
    });

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={download}>
        <Download />
        Export report
      </Button>
      <Button size="sm" variant="secondary" onClick={() => window.print()}>
        <Printer />
        Print / PDF
      </Button>
      <Button size="sm" variant="secondary" onClick={copy}>
        {copied ? <Check /> : <Copy />}
        Copy
      </Button>
      {confirming ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="danger" onClick={archive} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Confirm archive
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(true)}
          title="Archive this case"
        >
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
