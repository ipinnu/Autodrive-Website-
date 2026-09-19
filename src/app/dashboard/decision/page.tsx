import Link from "next/link";
import { BarChart3, LayoutDashboard } from "lucide-react";

export default function DecisionPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FA] lg:pl-80">
      <aside className="border-b border-navy/10 bg-white px-4 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:w-80 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">AutoDrive</p>
        <h1 className="font-lora text-2xl font-bold text-navy">Dashboard</h1>
        <nav className="mt-5 grid gap-2">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold text-navy/70 transition hover:bg-navy/5 hover:text-navy"><LayoutDashboard className="h-4 w-4" /> Overview</Link>
          <Link href="/dashboard/decision" className="flex items-center gap-3 rounded-md bg-navy px-3 py-3 text-sm font-black text-white"><BarChart3 className="h-4 w-4" /> Decision</Link>
        </nav>
      </aside>
      <main className="px-4 py-8 md:px-8 lg:px-12">
        <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Decision</p>
          <h2 className="mt-2 font-lora text-3xl font-bold text-navy">Decision workspace</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-navy/65">This page is intentionally open for your next layer of strategy, deeper notes, and decision tools after the overview page is settled.</p>
        </div>
      </main>
    </div>
  );
}

