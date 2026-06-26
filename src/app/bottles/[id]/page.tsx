import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit, Minus, Plus, Trash2 } from "lucide-react";
import { deleteTransaction, updateTransaction } from "@/lib/actions";
import { getBottleDashboard } from "@/lib/bottleService";
import { AppShell } from "@/components/layout/AppShell";
import { BottleComposition } from "@/components/charts/BottleComposition";
import { ContributorBars, FlavorRadar, HistoryCharts } from "@/components/charts/DashboardCharts";
import { formatMlAsOz } from "@/lib/units";
import type { ComponentBreakdown, MashBillEstimate } from "@/lib/blendMath";
import type { FlavorProfile } from "@/lib/flavorModel";

export const dynamic = "force-dynamic";

export default async function BottlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dashboard = await getBottleDashboard(id);
  if (!dashboard) notFound();
  const { bottle, latestSnapshot } = dashboard;
  const components = (latestSnapshot?.componentBreakdownJson ?? []) as unknown as ComponentBreakdown[];
  const flavor = (latestSnapshot?.flavorProfileJson ?? null) as FlavorProfile | null;
  const mash = (latestSnapshot?.mashBillJson ?? null) as MashBillEstimate | null;

  return (
    <AppShell>
      <main className="space-y-6">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-copper">Infinity bottle</p>
            <h1 className="font-display text-5xl font-black text-barrel">{bottle.name}</h1>
            <p className="mt-2 max-w-3xl font-semibold text-smoke">{bottle.description || "A living blend with every add and pour preserved in the ledger."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/bottles/${bottle.id}/add`} className="button-primary"><Plus size={17} /> Add spirit</Link>
            <Link href={`/bottles/${bottle.id}/remove`} className="button-secondary"><Minus size={17} /> Remove pour</Link>
            <Link href={`/bottles/${bottle.id}/edit`} className="button-secondary"><Edit size={17} /> Edit</Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Current proof" value={latestSnapshot ? latestSnapshot.proof.toFixed(1) : "0"} detail={`${latestSnapshot?.abvPercent.toFixed(1) ?? "0.0"}% ABV`} highlight />
          <Metric label="Volume" value={latestSnapshot ? formatMlAsOz(latestSnapshot.totalVolumeMl) : "0 oz"} detail={`${Math.round(latestSnapshot?.totalVolumeMl ?? 0)} ml`} />
          <Metric label="Contributors" value={String(components.length)} detail={components[0]?.displayName ?? "No spirits yet"} />
          <Metric label="Largest share" value={components[0] ? `${components[0].sharePct.toFixed(1)}%` : "0%"} detail={components[0]?.displayName ?? "None"} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="card p-5">
            <h2 className="mb-4 text-xl font-black text-barrel">Bottle composition</h2>
            {components.length ? <BottleComposition components={components} /> : <EmptyBlend />}
          </div>
          <div className="card p-5">
            <h2 className="text-xl font-black text-barrel">Estimated flavor profile</h2>
            <p className="mt-1 text-sm font-semibold text-smoke">Approximate, volume-weighted from spirit profiles.</p>
            {flavor ? <FlavorRadar profile={flavor} /> : <EmptyBlend />}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-4 text-xl font-black text-barrel">Contributor breakdown</h2>
            {components.length ? <ContributorBars components={components} /> : <EmptyBlend />}
          </div>
          <div className="card p-5">
            <h2 className="mb-4 text-xl font-black text-barrel">Estimated mash bill</h2>
            {mash ? <MashBill mash={mash} /> : <EmptyBlend />}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-xl font-black text-barrel">History</h2>
          {bottle.snapshots.length ? <HistoryCharts snapshots={bottle.snapshots} /> : <EmptyBlend />}
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-oak/10 p-5">
            <h2 className="text-xl font-black text-barrel">Transaction history</h2>
          </div>
          <div className="divide-y divide-oak/10">
            {bottle.transactions.map((transaction) => {
              const deleteAction = deleteTransaction.bind(null, bottle.id, transaction.id);
              const updateAction = updateTransaction.bind(null, bottle.id, transaction.id);
              return (
                <div key={transaction.id} className="grid gap-3 p-5">
                  <div>
                    <p className="font-black text-barrel">
                      {transaction.transactionType === "ADD" ? "Added" : "Removed"} {formatMlAsOz(transaction.amountMl)}
                      {transaction.spirit ? ` - ${transaction.spirit.displayName}` : ""}
                    </p>
                    <p className="text-sm font-semibold text-smoke">{transaction.transactionTime.toLocaleString()} {transaction.notes ? `- ${transaction.notes}` : ""}</p>
                  </div>
                  <form action={deleteAction}>
                    <button className="button-danger" type="submit"><Trash2 size={16} /> Delete</button>
                  </form>
                  <details className="rounded-xl bg-parchment/60 p-4">
                    <summary className="cursor-pointer text-sm font-black text-oak">Edit transaction</summary>
                    <form action={updateAction} className="mt-4 grid gap-3 md:grid-cols-5">
                      <input type="hidden" name="transactionType" value={transaction.transactionType} />
                      {transaction.transactionType === "ADD" && transaction.spiritId ? <input type="hidden" name="spiritId" value={transaction.spiritId} /> : null}
                      <label>Amount<input name="amount" type="number" min="0.01" step="0.01" defaultValue={(transaction.amountMl / 29.5735295625).toFixed(2)} /></label>
                      <label>Unit<select name="unit" defaultValue="oz"><option value="oz">oz</option><option value="ml">ml</option></select></label>
                      <label className="md:col-span-2">Date<input name="transactionTime" type="datetime-local" defaultValue={transaction.transactionTime.toISOString().slice(0, 16)} /></label>
                      <label className="md:col-span-5">Notes<input name="notes" defaultValue={transaction.notes ?? ""} /></label>
                      <button className="button-primary md:col-span-2" type="submit">Save edit</button>
                    </form>
                  </details>
                </div>
              );
            })}
            {bottle.transactions.length === 0 && <div className="p-5"><EmptyBlend /></div>}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Metric({ label, value, detail, highlight = false }: { label: string; value: string; detail: string; highlight?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? "bg-amber/15" : ""}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-smoke">{label}</p>
      <p className="mt-2 text-3xl font-black text-barrel">{value}</p>
      <p className="mt-1 text-sm font-bold text-smoke">{detail}</p>
    </div>
  );
}

function EmptyBlend() {
  return <p className="rounded-xl bg-parchment/70 p-4 text-sm font-bold text-smoke">No blend data yet. Add a spirit to start the ledger.</p>;
}

function MashBill({ mash }: { mash: MashBillEstimate }) {
  const rows = [
    ["Corn", mash.cornPct],
    ["Rye", mash.ryePct],
    ["Wheat", mash.wheatPct],
    ["Malted barley", mash.maltedBarleyPct],
    ["Other grain", mash.otherGrainPct]
  ] as const;
  return (
    <div className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <div className="mb-1 flex justify-between text-sm font-black text-oak"><span>{label}</span><span>{value == null ? "Unknown" : `${value.toFixed(1)}%`}</span></div>
          <div className="h-3 rounded-full bg-tan"><div className="h-3 rounded-full bg-copper" style={{ width: `${value ?? 0}%` }} /></div>
        </div>
      ))}
      <p className="pt-2 text-sm font-semibold text-smoke">
        Confidence: {mash.confidence == null ? "unknown" : `${Math.round(mash.confidence * 100)}%`}. Estimate ignores unknown fields where needed.
      </p>
      {mash.notes.length > 0 && <p className="text-sm font-semibold text-smoke">{mash.notes.join(" ")}</p>}
    </div>
  );
}
