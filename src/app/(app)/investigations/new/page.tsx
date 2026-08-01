import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Uploader } from "@/components/investigation/uploader";

export const metadata = { title: "New investigation" };

export default function NewInvestigationPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 py-10 sm:px-10 sm:py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Dashboard
      </Link>

      <div className="mb-8 mt-5 animate-fade-up">
        <h1 className="text-[30px] font-semibold leading-tight tracking-tighter">
          Open an investigation
        </h1>
        <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-muted-foreground">
          Add every document that belongs to the transaction. Cross-document checks — the
          three-way match, the settlement trail — only run when their counterparts are
          present.
        </p>
      </div>

      <div className="animate-fade-up [animation-delay:80ms]">
        <Uploader />
      </div>
    </div>
  );
}
