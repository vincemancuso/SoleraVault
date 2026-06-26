import type { Prisma, Spirit, SpiritFlavorProfile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  replayBottleLedger,
  type BottleLedgerTransaction,
  type SpiritInput
} from "@/lib/blendMath";

type SpiritWithFlavor = Spirit & { flavor: SpiritFlavorProfile | null };

export type BottleCurrentState = NonNullable<ReturnType<typeof replayBottleLedger>["current"]>;

export async function replayBottle(bottleId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.bottleComponent.deleteMany({ where: { bottleId } });
    await tx.bottleSnapshot.deleteMany({ where: { bottleId } });

    const transactions = await tx.bottleTransaction.findMany({
      where: { bottleId },
      orderBy: [{ transactionTime: "asc" }, { createdAt: "asc" }]
    });

    const spiritIds = [...new Set(transactions.map((transaction) => transaction.spiritId).filter(Boolean))] as string[];
    const spirits = await tx.spirit.findMany({
      where: { id: { in: spiritIds } },
      include: { flavor: true }
    });

    const result = replayBottleLedger(
      transactions.map((transaction): BottleLedgerTransaction => ({
        id: transaction.id,
        transactionType: transaction.transactionType,
        spiritId: transaction.spiritId,
        amountMl: transaction.amountMl,
        transactionTime: transaction.transactionTime,
        notes: transaction.notes
      })),
      new Map(spirits.map((spirit) => [spirit.id, toSpiritInput(spirit)]))
    );

    if (result.components.length > 0) {
      await tx.bottleComponent.createMany({
        data: result.components.map((component) => ({
          bottleId,
          spiritId: component.spirit.id,
          remainingVolumeMl: component.remainingVolumeMl,
          remainingEthanolMl: component.remainingEthanolMl
        }))
      });
    }

    if (result.snapshots.length > 0) {
      await tx.bottleSnapshot.createMany({
        data: result.snapshots.map((snapshot) => ({
          bottleId,
          transactionId: snapshot.transactionId,
          snapshotTime: snapshot.snapshotTime,
          totalVolumeMl: snapshot.totalVolumeMl,
          totalEthanolMl: snapshot.totalEthanolMl,
          abvPercent: snapshot.abvPercent,
          proof: snapshot.proof,
          componentBreakdownJson: snapshot.componentBreakdown as unknown as Prisma.InputJsonValue,
          categoryBreakdownJson: snapshot.categoryBreakdown as unknown as Prisma.InputJsonValue,
          mashBillJson: snapshot.mashBill as unknown as Prisma.InputJsonValue,
          flavorProfileJson: snapshot.flavorProfile as unknown as Prisma.InputJsonValue
        }))
      });
    }
  });
}

export async function getBottleDashboard(bottleId: string) {
  const bottle = await prisma.bottle.findUnique({
    where: { id: bottleId },
    include: {
      components: { include: { spirit: true }, orderBy: { remainingVolumeMl: "desc" } },
      snapshots: { orderBy: { snapshotTime: "asc" } },
      transactions: {
        include: { spirit: true },
        orderBy: { transactionTime: "desc" }
      }
    }
  });

  if (!bottle) return null;

  const latestSnapshot = bottle.snapshots.at(-1) ?? null;
  return { bottle, latestSnapshot };
}

export function toSpiritInput(spirit: SpiritWithFlavor): SpiritInput {
  return {
    id: spirit.id,
    displayName: spirit.displayName,
    category: spirit.category,
    abvPercent: spirit.abvPercent,
    proof: spirit.proof,
    cornPct: spirit.cornPct,
    ryePct: spirit.ryePct,
    wheatPct: spirit.wheatPct,
    maltedBarleyPct: spirit.maltedBarleyPct,
    otherGrainPct: spirit.otherGrainPct,
    mashBillConfidence: spirit.mashBillConfidence,
    mashBillNotes: spirit.mashBillNotes,
    flavor: spirit.flavor ?? undefined
  };
}
