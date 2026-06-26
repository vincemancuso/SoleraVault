import Link from "next/link";
import { createSpirit } from "@/lib/actions";
import { spiritLookupEnabled } from "@/lib/openaiSpiritLookup";
import { AppShell } from "@/components/layout/AppShell";
import { flavorDimensions } from "@/lib/flavorModel";

export default function NewSpiritPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-4xl">
        <h1 className="font-display text-4xl font-black text-barrel">Create spirit</h1>
        <p className="mt-2 font-semibold text-smoke">
          {spiritLookupEnabled ? "OpenAI lookup is available as draft assistance." : "OpenAI lookup is disabled. Manual entry works fully."}
        </p>
        <form action={createSpirit} className="card mt-6 grid gap-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label>Display name<input name="displayName" required placeholder="Wild Turkey 101 Bourbon" /></label>
            <label>Canonical name<input name="canonicalName" placeholder="wild turkey 101 bourbon" /></label>
            <label>Brand<input name="brand" /></label>
            <label>Producer<input name="producer" /></label>
            <label>Category<input name="category" required defaultValue="Bourbon" /></label>
            <label>Country<input name="country" defaultValue="United States" /></label>
            <label>Region<input name="region" /></label>
            <label>ABV percent<input name="abvPercent" type="number" min="0.1" max="95" step="0.1" required defaultValue="50" /></label>
            <label>Age years<input name="ageYears" type="number" min="0" step="0.1" /></label>
          </div>
          <fieldset className="grid gap-4 md:grid-cols-5">
            <legend className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-smoke">Mash bill estimate</legend>
            <label>Corn %<input name="cornPct" type="number" min="0" max="100" step="0.1" /></label>
            <label>Rye %<input name="ryePct" type="number" min="0" max="100" step="0.1" /></label>
            <label>Wheat %<input name="wheatPct" type="number" min="0" max="100" step="0.1" /></label>
            <label>Malted barley %<input name="maltedBarleyPct" type="number" min="0" max="100" step="0.1" /></label>
            <label>Other %<input name="otherGrainPct" type="number" min="0" max="100" step="0.1" /></label>
          </fieldset>
          <div className="grid gap-4 md:grid-cols-2">
            <label>Mash confidence<input name="mashBillConfidence" type="number" min="0" max="1" step="0.01" /></label>
            <label>Source confidence<input name="sourceConfidence" type="number" min="0" max="1" step="0.01" /></label>
            <label className="md:col-span-2">Mash notes<textarea name="mashBillNotes" rows={3} /></label>
          </div>
          <fieldset className="grid gap-4 md:grid-cols-5">
            <legend className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-smoke">Flavor profile, 0-5</legend>
            {flavorDimensions.map((dimension) => (
              <label key={dimension}>{dimension}<input name={dimension} type="number" min="0" max="5" step="0.1" defaultValue="2" /></label>
            ))}
          </fieldset>
          <input type="hidden" name="dataSource" value="manual" />
          <label className="flex-row items-center gap-3 font-bold"><input className="w-auto" name="userVerified" type="checkbox" defaultChecked /> User verified</label>
          <div className="flex gap-3">
            <button className="button-primary" type="submit">Save spirit</button>
            <Link className="button-secondary" href="/spirits">Cancel</Link>
          </div>
        </form>
      </main>
    </AppShell>
  );
}
