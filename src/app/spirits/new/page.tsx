import Link from "next/link";
import { createSpirit } from "@/lib/actions";
import { spiritLookupEnabled } from "@/lib/openaiSpiritLookup";
import { AppShell } from "@/components/layout/AppShell";
import { SpiritForm } from "@/components/forms/SpiritForm";
import { lookupOpenFoodFactsByBarcode } from "@/lib/openFoodFacts";
import { lookupSpiritWithOpenAI } from "@/lib/openaiSpiritLookup";

export default async function NewSpiritPage({ searchParams }: { searchParams: Promise<{ barcode?: string; aiName?: string }> }) {
  const { barcode, aiName } = await searchParams;
  const openFoodFactsDraft = barcode ? await lookupOpenFoodFactsByBarcode(barcode) : null;
  const aiDraft = aiName && spiritLookupEnabled ? await lookupSpiritWithOpenAI(aiName) : null;
  const draft = aiDraft ? { ...aiDraft, dataSource: "openai_suggested" as const } : openFoodFactsDraft;

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-4xl">
        <h1 className="font-display text-4xl font-black text-barrel">Add to My Bar</h1>
        <p className="mt-2 font-semibold text-smoke">
          {spiritLookupEnabled ? "OpenAI lookup is available as draft assistance." : "OpenAI lookup is disabled. Manual entry works fully."}
        </p>
        <form action="/spirits/new" className="card mt-6 grid gap-4 p-5">
          <label>Open Food Facts barcode lookup<input name="barcode" placeholder="Scan or type a bottle barcode" defaultValue={barcode ?? ""} /></label>
          <div className="flex flex-wrap gap-3">
            <button className="button-secondary" type="submit">Import draft</button>
            {draft === null && barcode ? <p className="self-center text-sm font-bold text-copper">No Open Food Facts product found for that barcode.</p> : null}
          </div>
        </form>
        {spiritLookupEnabled ? (
          <form action="/spirits/new" className="card mt-4 grid gap-4 p-5">
            <label>Complete with AI<input name="aiName" placeholder="Bottle name, e.g. Wild Turkey 101 Bourbon" defaultValue={aiName ?? draft?.displayName ?? ""} /></label>
            <button className="button-secondary w-fit" type="submit">Complete with AI</button>
          </form>
        ) : (
          <div className="card mt-4 p-5 text-sm font-semibold text-smoke">Complete with AI is available when `OPENAI_API_KEY` is set.</div>
        )}
        <SpiritForm action={createSpirit} mode="create" draft={draft} />
        <p className="mt-4 text-sm font-semibold text-smoke">
          Open Food Facts imports are draft metadata. Kaggle datasets need license review before bundling, TTB data is not bottle-level lookup, and Distiller-style sites should be treated as research-only unless they provide a permitted API/license.
        </p>
      </main>
    </AppShell>
  );
}
