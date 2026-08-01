import { Skeleton } from "@/components/ui/skeleton";

export default function InvestigationLoading() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 py-10 sm:px-10 sm:py-12">
      <Skeleton className="h-4 w-24" />
      <div className="mt-5 space-y-2.5">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-8 w-[420px] max-w-full" />
      </div>
      <Skeleton className="mt-7 h-[280px] rounded-lg" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[520px] rounded-lg" />
        <div className="space-y-6">
          <Skeleton className="h-[240px] rounded-lg" />
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
