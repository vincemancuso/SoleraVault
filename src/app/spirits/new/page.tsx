import Link from "next/link";
import { createSpirit } from "@/lib/actions";
import { spiritLookupEnabled } from "@/lib/openaiSpiritLookup";
import { AppShell } from "@/components/layout/AppShell";
import { SpiritForm } from "@/components/forms/SpiritForm";
import { lookupSpiritWithOpenAI } from "@/lib/openaiSpiritLookup";

export default async function NewSpiritPage({ searchParams }: { searchParams: Promise<{ displayName?: string }> }) {
  const { displayName } = await searchParams;
  const aiDraft = displayName && spiritLookupEnabled ? await lookupSpiritWithOpenAI(displayName) : null;
  const draft = aiDraft ? { ...aiDraft, dataSource: "openai_suggested" as const } : null;

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-4xl">
        <h1 className="font-display text-4xl font-black text-barrel">Add to My Bar</h1>
        <p className="mt-2 font-semibold text-smoke">
          {spiritLookupEnabled ? "OpenAI lookup is available as draft assistance." : "OpenAI lookup is disabled. Manual entry works fully."}
        </p>
        <SpiritForm
          action={createSpirit}
          mode="create"
          draft={draft}
          aiCompletionEnabled={spiritLookupEnabled}
          aiCompletionPath="/spirits/new"
        />
      </main>
    </AppShell>
  );
}
