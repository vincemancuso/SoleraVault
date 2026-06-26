import Link from "next/link";
import { notFound } from "next/navigation";
import { updateBottle, archiveBottle, deleteBottle } from "@/lib/actions";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { fromMl } from "@/lib/units";

export const dynamic = "force-dynamic";

export default async function EditBottlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bottle = await prisma.bottle.findUnique({ where: { id } });
  if (!bottle) notFound();
  const update = updateBottle.bind(null, bottle.id);
  const archive = archiveBottle.bind(null, bottle.id);
  const remove = deleteBottle.bind(null, bottle.id);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="font-display text-4xl font-black text-barrel">Edit bottle</h1>
        <form action={update} className="card grid gap-5 p-6">
          <label>Name<input name="name" required defaultValue={bottle.name} /></label>
          <label>Description<textarea name="description" rows={4} defaultValue={bottle.description ?? ""} /></label>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <label>Target volume<input name="targetVolume" type="number" min="1" step="0.1" defaultValue={fromMl(bottle.targetVolumeMl, "ml")} required /></label>
            <label>Unit<select name="targetUnit" defaultValue="ml"><option value="ml">ml</option><option value="oz">oz</option></select></label>
          </div>
          <div className="flex gap-3">
            <button className="button-primary" type="submit">Save changes</button>
            <Link href={`/bottles/${bottle.id}`} className="button-secondary">Cancel</Link>
          </div>
        </form>
        <div className="card flex flex-wrap gap-3 p-6">
          <form action={archive}><button className="button-secondary" type="submit">Archive bottle</button></form>
          <form action={remove}><button className="button-danger" type="submit">Delete bottle</button></form>
        </div>
      </main>
    </AppShell>
  );
}
