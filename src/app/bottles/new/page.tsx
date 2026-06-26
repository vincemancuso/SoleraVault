import Link from "next/link";
import { createBottle } from "@/lib/actions";
import { AppShell } from "@/components/layout/AppShell";

export default function NewBottlePage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-4xl font-black text-barrel">Create bottle</h1>
        <form action={createBottle} className="card mt-6 grid gap-5 p-6">
          <label>Name<input name="name" required placeholder="House Infinity Bottle" /></label>
          <label>Description<textarea name="description" rows={4} placeholder="Blend goal, bottle story, tasting notes..." /></label>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <label>Target volume<input name="targetVolume" type="number" min="1" step="0.1" defaultValue="750" required /></label>
            <label>Unit<select name="targetUnit" defaultValue="ml"><option value="ml">ml</option><option value="oz">oz</option></select></label>
          </div>
          <div className="flex gap-3">
            <button className="button-primary" type="submit">Save bottle</button>
            <Link href="/" className="button-secondary">Cancel</Link>
          </div>
        </form>
      </main>
    </AppShell>
  );
}
