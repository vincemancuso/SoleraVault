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
  searchParams: Promise<{ aiName?: string }>;
}) {
  const { id } = await params;
  const { aiName } = await searchParams;
  const spirit = await prisma.spirit.findUnique({
    where: { id },
    include: { flavor: true }
  });
  if (!spirit) notFound();
  const aiDraft = aiName && spiritLookupEnabled ? await lookupSpiritWithOpenAI(aiName) : null;
  const action = updateSpirit.bind(null, spirit.id);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-4xl">
        <h1 className="font-display text-4xl font-black text-barrel">Edit bar bottle</h1>
        <p className="mt-2 font-semibold text-smoke">
          Changes to ABV, mash bill, or flavor will replay any infinity bottles that already use this spirit.
        </p>
        {spiritLookupEnabled ? (
          <form action={`/spirits/${spirit.id}/edit`} className="card mt-6 grid gap-4 p-5">
            <label>Complete with AI<input name="aiName" placeholder="Bottle name" defaultValue={aiName ?? spirit.displayName} /></label>
            <button className="button-secondary w-fit" type="submit">Complete with AI</button>
          </form>
        ) : (
          <div className="card mt-6 p-5 text-sm font-semibold text-smoke">Complete with AI is available when `OPENAI_API_KEY` is set.</div>
        )}
        <SpiritForm
          action={action}
          mode="edit"
          spirit={spirit}
          draft={aiDraft ? { ...aiDraft, dataSource: "openai_suggested" as const } : null}
        />
      </main>
    </AppShell>
  );
}
