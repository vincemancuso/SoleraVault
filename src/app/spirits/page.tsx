import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SpiritsPage() {
  const spirits = await prisma.spirit.findMany({
    include: { flavor: true },
    orderBy: { displayName: "asc" }
  });

  return (
    <AppShell>
      <main className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-black text-barrel">Spirit database</h1>
            <p className="mt-2 font-semibold text-smoke">Local spirits for adds, with draft metadata you can review and refine.</p>
          </div>
          <Link href="/spirits/new" className="button-primary"><Plus size={17} /> New spirit</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {spirits.map((spirit) => (
            <div key={spirit.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-barrel">{spirit.displayName}</h2>
                  <p className="text-sm font-semibold text-smoke">{spirit.category} {spirit.region ? `- ${spirit.region}` : ""}</p>
                </div>
                <span className="rounded-full bg-gold/25 px-3 py-1 text-xs font-black text-oak">{spirit.proof} proof</span>
              </div>
              <p className="mt-4 text-sm font-semibold text-smoke">
                Source: {spirit.dataSource ?? "manual"} {spirit.userVerified ? "- verified" : "- draft"}
              </p>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
