import Link from "next/link";
import type { Spirit, SpiritFlavorProfile } from "@prisma/client";
import { flavorDimensions, type FlavorProfile } from "@/lib/flavorModel";
import type { SpiritLookupDraft } from "@/lib/openaiSpiritLookup";

type SpiritWithFlavor = Spirit & { flavor: SpiritFlavorProfile | null };
type SpiritFormDraft = (SpiritLookupDraft & { dataSource?: "openai_suggested" }) & {
  dataSource?: string;
  ageYears?: number | null;
  cornPct?: number | null;
  ryePct?: number | null;
  wheatPct?: number | null;
  maltedBarleyPct?: number | null;
  otherGrainPct?: number | null;
  mashBillConfidence?: number | null;
};

type SpiritFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  mode: "create" | "edit";
  spirit?: SpiritWithFlavor;
  draft?: SpiritFormDraft | null;
  aiCompletionEnabled?: boolean;
  aiCompletionPath?: string;
};

export function SpiritForm({ action, mode, spirit, draft, aiCompletionEnabled = false, aiCompletionPath }: SpiritFormProps) {
  const flavor = draft?.flavor ?? spirit?.flavor ?? {};
  const sourceConfidence = draft?.sourceConfidence ?? spirit?.sourceConfidence ?? undefined;

  return (
    <form action={action} className="card mt-6 grid gap-6 p-6">
      {draft?.warnings?.length ? (
        <div className="rounded-xl border border-gold/40 bg-gold/15 p-4 text-sm font-semibold text-oak">
          <p className="font-black">Imported draft</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {draft.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label>Display name<input name="displayName" required defaultValue={draft?.displayName ?? spirit?.displayName ?? ""} placeholder="Wild Turkey 101 Bourbon" /></label>
          {aiCompletionEnabled && aiCompletionPath ? (
            <button className="button-secondary w-fit" type="submit" formAction={aiCompletionPath} formMethod="get">
              Complete with AI
            </button>
          ) : null}
        </div>
        <label>Canonical name<input name="canonicalName" defaultValue={draft?.canonicalName ?? spirit?.canonicalName ?? ""} placeholder="wild turkey 101 bourbon" /></label>
        <label>Brand<input name="brand" defaultValue={draft?.brand ?? spirit?.brand ?? ""} /></label>
        <label>Producer<input name="producer" defaultValue={draft?.producer ?? spirit?.producer ?? ""} /></label>
        <label>Category<input name="category" required defaultValue={draft?.category ?? spirit?.category ?? "Bourbon"} /></label>
        <label>Country<input name="country" defaultValue={draft?.country ?? spirit?.country ?? "United States"} /></label>
        <label>Region<input name="region" defaultValue={draft?.region ?? spirit?.region ?? ""} /></label>
        <label>ABV percent<input name="abvPercent" type="number" min="0.1" max="95" step="0.1" required defaultValue={draft?.abvPercent ?? spirit?.abvPercent ?? 50} /></label>
        <label>Age years<input name="ageYears" type="number" min="0" step="0.1" defaultValue={draft?.ageYears ?? spirit?.ageYears ?? ""} /></label>
      </div>
      <fieldset className="grid gap-4 md:grid-cols-5">
        <legend className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-smoke">Mash bill estimate</legend>
        <label>Corn %<input name="cornPct" type="number" min="0" max="100" step="0.1" defaultValue={draft?.cornPct ?? spirit?.cornPct ?? ""} /></label>
        <label>Rye %<input name="ryePct" type="number" min="0" max="100" step="0.1" defaultValue={draft?.ryePct ?? spirit?.ryePct ?? ""} /></label>
        <label>Wheat %<input name="wheatPct" type="number" min="0" max="100" step="0.1" defaultValue={draft?.wheatPct ?? spirit?.wheatPct ?? ""} /></label>
        <label>Malted barley %<input name="maltedBarleyPct" type="number" min="0" max="100" step="0.1" defaultValue={draft?.maltedBarleyPct ?? spirit?.maltedBarleyPct ?? ""} /></label>
        <label>Other %<input name="otherGrainPct" type="number" min="0" max="100" step="0.1" defaultValue={draft?.otherGrainPct ?? spirit?.otherGrainPct ?? ""} /></label>
      </fieldset>
      <div className="grid gap-4 md:grid-cols-2">
        <label>Mash confidence<input name="mashBillConfidence" type="number" min="0" max="1" step="0.01" defaultValue={draft?.mashBillConfidence ?? spirit?.mashBillConfidence ?? ""} /></label>
        <label>Source confidence<input name="sourceConfidence" type="number" min="0" max="1" step="0.01" defaultValue={sourceConfidence ?? ""} /></label>
        <label className="md:col-span-2">Mash notes<textarea name="mashBillNotes" rows={3} defaultValue={draft?.mashBillNotes ?? spirit?.mashBillNotes ?? ""} /></label>
      </div>
      <fieldset className="grid gap-4 md:grid-cols-5">
        <legend className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-smoke">Flavor profile, 0-5</legend>
        {flavorDimensions.map((dimension) => (
          <label key={dimension}>
            {dimension}
            <input
              name={dimension}
              type="number"
              min="0"
              max="5"
              step="0.1"
              defaultValue={getFlavorValue(flavor, dimension)}
            />
          </label>
        ))}
      </fieldset>
      <input type="hidden" name="dataSource" value={draft?.dataSource ?? spirit?.dataSource ?? "manual"} />
      <label className="flex-row items-center gap-3 font-bold">
        <input className="w-auto" name="userVerified" type="checkbox" defaultChecked={mode === "edit" ? spirit?.userVerified : !draft} /> User verified
      </label>
      <div className="flex gap-3">
        <button className="button-primary" type="submit">{mode === "edit" ? "Save changes" : "Save to My Bar"}</button>
        <Link className="button-secondary" href="/spirits">Cancel</Link>
      </div>
    </form>
  );
}

function getFlavorValue(flavor: Partial<FlavorProfile> | SpiritFlavorProfile, dimension: keyof FlavorProfile): number {
  const value = flavor?.[dimension];
  return typeof value === "number" ? value : 2;
}
