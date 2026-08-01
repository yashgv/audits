"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileSpreadsheet,
  FileText,
  Landmark,
  Loader2,
  Receipt,
  ScrollText,
  Trash2,
  UploadCloud,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { DOC_TYPES, type DocType, type DocumentInput } from "@/lib/types";
import { fingerprintOf, inferDocType } from "@/lib/investigation/documents";
import { createInvestigationSchema } from "@/lib/validations";
import { createInvestigationAction } from "@/app/actions/investigations";
import { cn, formatBytes } from "@/lib/utils";

const ICONS: Record<DocType, typeof FileText> = {
  Invoice: Receipt,
  "GST Return": ScrollText,
  "Purchase Order": FileSpreadsheet,
  "Bank Statement": Landmark,
  "Salary Slip": Wallet,
  "Tax Form": ScrollText,
  "Supporting Document": FileText,
};

const MAX_FILES = 12;
const MAX_BYTES = 50 * 1024 * 1024;

type FormValues = { title: string; subject?: string; notes?: string };

export function Uploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentInput[]>([]);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createInvestigationSchema.omit({ documents: true })),
    defaultValues: { title: "", subject: "", notes: "" },
  });

  const addFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;

    setDocs((current) => {
      const next = [...current];
      let skipped = 0;
      let oversized = 0;

      for (const file of Array.from(files)) {
        if (next.length >= MAX_FILES) {
          skipped++;
          continue;
        }
        if (file.size > MAX_BYTES) {
          oversized++;
          continue;
        }
        if (next.some((d) => d.name === file.name && d.size === file.size)) {
          skipped++;
          continue;
        }
        next.push({
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          docType: inferDocType(file.name),
          fingerprint: fingerprintOf(file.name, file.size),
        });
      }

      if (oversized) toast.error(`${oversized} file(s) exceed the 50 MB limit`);
      else if (skipped) toast.message(`${skipped} file(s) skipped — duplicate or over the ${MAX_FILES}-file limit`);
      return next;
    });
  }, []);

  const onSubmit = handleSubmit((values) => {
    if (docs.length === 0) {
      toast.error("Add at least one document to investigate");
      return;
    }
    startTransition(async () => {
      const result = await createInvestigationAction({ ...values, documents: docs });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.push(`/investigations/${result.data.id}`);
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ---------------- Dropzone ---------------- */}
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "glass relative cursor-pointer overflow-hidden px-6 py-14 text-center transition-all duration-300",
            dragging
              ? "border-primary/50 bg-primary/[0.06]"
              : "border-dashed border-white/[0.1] hover:border-white/25 hover:bg-white/[0.03]",
          )}
        >
          {dragging ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-24 step-shine animate-scan"
            />
          ) : null}

          <motion.div
            animate={{ scale: dragging ? 1.08 : 1, y: dragging ? -3 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]"
          >
            <UploadCloud className={cn("size-6", dragging ? "text-primary" : "text-muted-foreground")} />
          </motion.div>

          <p className="mt-5 text-[15px] font-medium tracking-tight">
            {dragging ? "Release to add to the case" : "Drop documents here"}
          </p>
          <p className="mx-auto mt-1.5 max-w-[44ch] text-[13px] leading-relaxed text-muted-foreground">
            Invoices, GST returns, purchase orders, bank statements, salary slips and tax
            forms. Up to {MAX_FILES} files, 50 MB each.
          </p>
          <p className="mt-4 text-[12px] text-muted-foreground/70">
            Only the file name, size and type are stored — contents stay on your machine.
          </p>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* ---------------- File list ---------------- */}
        <AnimatePresence initial={false}>
          {docs.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass divide-y divide-white/[0.05]"
            >
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {docs.length} document{docs.length === 1 ? "" : "s"} staged
                </span>
                <button
                  type="button"
                  onClick={() => setDocs([])}
                  className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear all
                </button>
              </div>

              <AnimatePresence initial={false}>
                {docs.map((doc) => {
                  const Icon = ICONS[doc.docType];
                  return (
                    <motion.div
                      key={`${doc.name}-${doc.size}`}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03]">
                        <Icon className="size-4 text-primary" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{doc.name}</p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                          {formatBytes(doc.size)} · {doc.fingerprint}
                        </p>
                      </div>

                      <select
                        value={doc.docType}
                        onChange={(e) =>
                          setDocs((cur) =>
                            cur.map((d) =>
                              d.name === doc.name && d.size === doc.size
                                ? { ...d, docType: e.target.value as DocType }
                                : d,
                            ),
                          )
                        }
                        className="hidden h-8 shrink-0 rounded-md border border-input bg-surface px-2 text-[12px] text-muted-foreground focus-visible:border-primary/50 focus-visible:outline-none sm:block"
                      >
                        {DOC_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          setDocs((cur) =>
                            cur.filter((d) => !(d.name === doc.name && d.size === doc.size)),
                          )
                        }
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-fail/10 hover:text-fail"
                        aria-label={`Remove ${doc.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ---------------- Case details ---------------- */}
      <div className="glass h-fit space-y-5 p-6">
        <div>
          <h2 className="text-[15px] font-medium tracking-tight">Case details</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Naming the counterparty sharpens the registry checks.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Case name</Label>
          <Input id="title" placeholder="Q3 vendor payout review" {...register("title")} />
          <FieldError>{errors.title?.message}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subject">Counterparty</Label>
          <Input id="subject" placeholder="Meridian Supplies Pvt Ltd" {...register("subject")} />
          <FieldError>{errors.subject?.message}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Context</Label>
          <Textarea
            id="notes"
            placeholder="Why is this being reviewed?"
            {...register("notes")}
          />
          <FieldError>{errors.notes?.message}</FieldError>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Opening case…
            </>
          ) : (
            `Run investigation${docs.length ? ` · ${docs.length} file${docs.length === 1 ? "" : "s"}` : ""}`
          )}
        </Button>

        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Findings are simulated for this demo build. No document contents are transmitted
          or analysed.
        </p>
      </div>
    </form>
  );
}
