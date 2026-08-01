import { Sidebar } from "@/components/shell/sidebar";
import { requireUser } from "@/lib/auth";
import { usingDatabase } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar user={user} persistent={usingDatabase} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
