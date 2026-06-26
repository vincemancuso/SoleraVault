import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getOrCreateDefaultUser } from "@/lib/defaultUser";
import { prisma } from "@/lib/prisma";
import { formatMlAsOz } from "@/lib/units";
import type { CategoryBreakdown } from "@/lib/blendMath";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getOrCreateDefaultUser();
  const bottles = await prisma.bottle.findMany({
    where: { userId: user.id, archivedAt: null },
    include: {
      snapshots: { orderBy: { snapshotTime: "desc" }, take: 1 },
      transactions: { orderBy: { transactionTime: "desc" }, take: 1 }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <AppShell>
      <main className="space-y-8">
        <section className="flex justify-end">
          <Link href="/bottles/new" className="button-primary">
            <Plus size={18} /> New bottle
          </Link>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bottles.map((bottle) => {
            const snapshot = bottle.snapshots[0];
            const categories = (snapshot?.categoryBreakdownJson ?? []) as unknown as CategoryBreakdown[];
            const dominantCategory = categories[0]?.category ?? "No blend yet";
            return (
              <Link key={bottle.id} href={`/bottles/${bottle.id}`} className="card block p-5 transition hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-barrel">{bottle.name}</h2>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-smoke">{bottle.description || "No notes yet"}</p>
                  </div>
                  <span className="rounded-full bg-gold/25 px-3 py-1 text-xs font-black text-oak">{dominantCategory}</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                  <Stat label="Volume" value={snapshot ? formatMlAsOz(snapshot.totalVolumeMl) : "0 oz"} />
                  <Stat label="Proof" value={snapshot ? snapshot.proof.toFixed(1) : "0"} />
                  <Stat label="Updated" value={bottle.transactions[0] ? bottle.transactions[0].transactionTime.toLocaleDateString() : "New"} />
                </div>
              </Link>
            );
          })}
        </section>

        {bottles.length === 0 && (
          <div className="card p-8 text-center">
            <h2 className="text-2xl font-black text-barrel">Start your first bottle</h2>
            <p className="mx-auto mt-2 max-w-xl font-semibold text-smoke">
              Create a bottle, add a few pours, and SoleraVault will replay the ledger into current proof, composition, flavor, and history.
            </p>
            <Link href="/bottles/new" className="button-primary mt-5">Create bottle</Link>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-smoke">{label}</p>
      <p className="mt-1 font-black text-barrel">{value}</p>
    </div>
  );
}
