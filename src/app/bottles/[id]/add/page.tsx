import Link from "next/link";
import { notFound } from "next/navigation";
import { addBottleTransaction } from "@/lib/actions";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AddSpiritPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bottle = await prisma.bottle.findUnique({ where: { id } });
  if (!bottle) notFound();
  const spirits = await prisma.spirit.findMany({ orderBy: { displayName: "asc" } });
  const action = addBottleTransaction.bind(null, bottle.id);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-4xl font-black text-barrel">Add spirit</h1>
        <p className="mt-2 font-semibold text-smoke">{bottle.name}</p>
        <form action={action} className="card mt-6 grid gap-5 p-6">
          <label>Spirit<select name="spiritId" required>{spirits.map((spirit) => <option key={spirit.id} value={spirit.id}>{spirit.displayName} ({spirit.proof} proof)</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required defaultValue="1.5" /></label>
            <label>Unit<select name="unit" defaultValue="oz"><option value="oz">oz</option><option value="ml">ml</option></select></label>
          </div>
          <label>Date and time<input name="transactionTime" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} /></label>
          <label>Notes<textarea name="notes" rows={3} placeholder="Bottle kill, tasting context, batch note..." /></label>
          <div className="flex flex-wrap gap-3">
            <button className="button-primary" type="submit">Save add</button>
            <Link className="button-secondary" href="/spirits/new">Add to My Bar</Link>
            <Link className="button-secondary" href={`/bottles/${bottle.id}`}>Cancel</Link>
          </div>
        </form>
      </main>
    </AppShell>
  );
}
