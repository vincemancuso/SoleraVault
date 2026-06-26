import Link from "next/link";
import { Edit, Plus, Trash2 } from "lucide-react";
import { deleteSpirit } from "@/lib/actions";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SpiritsPage({ searchParams }: { searchParams: Promise<{ removeError?: string }> }) {
  const { removeError } = await searchParams;
  const spirits = await prisma.spirit.findMany({
    include: { flavor: true },
    orderBy: { displayName: "asc" }
  });

  return (
    <AppShell>
      <main className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-black text-barrel">My Bar</h1>
            <p className="mt-2 font-semibold text-smoke">Liquors you own and can add to your infinity bottles, with metadata you can review and refine.</p>
          </div>
          <Link href="/spirits/new" className="button-primary"><Plus size={17} /> Add bottle</Link>
        </div>
        {removeError === "used" ? (
          <div className="card border-amber/40 bg-amber/10 p-4 text-sm font-semibold text-charcoal">
            That bottle is already used in an infinity bottle ledger, so it cannot be removed without breaking history.
          </div>
        ) : null}
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead className="border-b border-border text-xs font-black uppercase tracking-[0.14em] text-slate">
              <tr>
                <th className="px-5 py-4">Bottle</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Proof</th>
                <th className="px-5 py-4">Origin</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {spirits.map((spirit) => {
                const remove = deleteSpirit.bind(null, spirit.id);
                return (
                  <tr key={spirit.id} className="align-middle">
                    <td className="px-5 py-4">
                      <p className="font-black text-charcoal">{spirit.displayName}</p>
                      <p className="text-sm font-medium text-slate">{spirit.brand || spirit.producer || "Unbranded"}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-charcoal">{spirit.category}</td>
                    <td className="px-5 py-4 font-black text-charcoal">{spirit.proof.toFixed(1)}</td>
                    <td className="px-5 py-4 text-sm font-medium text-slate">{[spirit.country, spirit.region].filter(Boolean).join(", ") || "Unknown"}</td>
                    <td className="px-5 py-4 text-sm font-medium text-slate">
                      {spirit.dataSource ?? "manual"} {spirit.userVerified ? "- verified" : "- draft"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/spirits/${spirit.id}/edit`} className="button-secondary"><Edit size={16} /> Edit</Link>
                        <form action={remove}>
                          <button className="button-danger" type="submit"><Trash2 size={16} /> Remove</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {spirits.length === 0 ? (
            <div className="p-6 text-center font-semibold text-slate">Your bar is empty. Add a bottle to start building blends.</div>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
