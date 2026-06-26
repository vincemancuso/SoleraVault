import { notFound } from "next/navigation";
import { updateSpirit } from "@/lib/actions";
import { AppShell } from "@/components/layout/AppShell";
import { SpiritForm } from "@/components/forms/SpiritForm";
import { prisma } from "@/lib/prisma";
import { lookupSpiritWithOpenAI, spiritLookupEnabled } from "@/lib/openaiSpiritLookup";

export const dynamic = "force-dynamic";

export default async function EditSpiritPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ displayName?: string }>;
}) {
  const { id } = await params;
  const { displayName } = await searchParams;
  const spirit = await prisma.spirit.findUnique({
    where: { id },
    include: { flavor: true }
  });
  if (!spirit) notFound();
  const aiDraft = displayName && spiritLookupEnabled ? await lookupSpiritWithOpenAI(displayName) : null;
  const action = updateSpirit.bind(null, spirit.id);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-4xl">
        <h1 className="font-display text-4xl font-black text-barrel">Edit bar bottle</h1>
        <p className="mt-2 font-semibold text-smoke">
          Changes to ABV, mash bill, or flavor will replay any infinity bottles that already use this spirit.
        </p>
        <SpiritForm
          action={action}
          mode="edit"
          spirit={spirit}
          draft={aiDraft ? { ...aiDraft, dataSource: "openai_suggested" as const } : null}
          aiCompletionEnabled={spiritLookupEnabled}
          aiCompletionPath={`/spirits/${spirit.id}/edit`}
        />
      </main>
    </AppShell>
  );
}
