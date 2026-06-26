import { emptyFlavorProfile, flavorDimensions, type FlavorProfile } from "@/lib/flavorModel";

export type TransactionType = "ADD" | "REMOVE";

export type SpiritInput = {
  id: string;
  displayName: string;
  category: string;
  abvPercent: number;
  proof?: number;
  cornPct?: number | null;
  ryePct?: number | null;
  wheatPct?: number | null;
  maltedBarleyPct?: number | null;
  otherGrainPct?: number | null;
  mashBillConfidence?: number | null;
  mashBillNotes?: string | null;
  flavor?: Partial<FlavorProfile> | null;
};

export type BottleLedgerTransaction = {
  id: string;
  transactionType: TransactionType;
  spiritId?: string | null;
  amountMl: number;
  transactionTime: Date;
  notes?: string | null;
};

export type BottleComponentState = {
  spirit: SpiritInput;
  remainingVolumeMl: number;
  remainingEthanolMl: number;
};

export type ComponentBreakdown = {
  spiritId: string;
  displayName: string;
  category: string;
  remainingVolumeMl: number;
  remainingEthanolMl: number;
  abvPercent: number;
  proof: number;
  sharePct: number;
};

export type CategoryBreakdown = {
  category: string;
  remainingVolumeMl: number;
  sharePct: number;
};

export type MashBillEstimate = {
  cornPct: number | null;
  ryePct: number | null;
  wheatPct: number | null;
  maltedBarleyPct: number | null;
  otherGrainPct: number | null;
  confidence: number | null;
  notes: string[];
};

export type BottleSnapshotState = {
  transactionId: string;
  snapshotTime: Date;
  totalVolumeMl: number;
  totalEthanolMl: number;
  abvPercent: number;
  proof: number;
  componentBreakdown: ComponentBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  mashBill: MashBillEstimate;
  flavorProfile: FlavorProfile;
};

export type ReplayResult = {
  components: BottleComponentState[];
  snapshots: BottleSnapshotState[];
  current: BottleSnapshotState | null;
};

const grainFields = ["cornPct", "ryePct", "wheatPct", "maltedBarleyPct", "otherGrainPct"] as const;

export function validateSpirit(spirit: SpiritInput): void {
  if (spirit.abvPercent <= 0 || spirit.abvPercent > 95) {
    throw new Error("ABV must be greater than 0 and no more than 95%.");
  }

  const knownMashTotal = grainFields.reduce((total, field) => total + (spirit[field] ?? 0), 0);
  if (knownMashTotal > 100.001) {
    throw new Error("Known mash bill percentages cannot exceed 100%.");
  }

  for (const dimension of flavorDimensions) {
    const value = spirit.flavor?.[dimension];
    if (value != null && (value < 0 || value > 5)) {
      throw new Error("Flavor profile values must be between 0 and 5.");
    }
  }
}

export function validateTransaction(transaction: BottleLedgerTransaction): void {
  if (transaction.amountMl <= 0) {
    throw new Error("Transaction amount must be positive.");
  }
  if (transaction.transactionType === "ADD" && !transaction.spiritId) {
    throw new Error("ADD transactions require a spirit.");
  }
  if (transaction.transactionType === "REMOVE" && transaction.spiritId) {
    throw new Error("REMOVE transactions must not have a spirit.");
  }
}

export function replayBottleLedger(
  transactions: BottleLedgerTransaction[],
  spiritsById: Map<string, SpiritInput>
): ReplayResult {
  const components = new Map<string, BottleComponentState>();
  const snapshots: BottleSnapshotState[] = [];
  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      a.transactionTime.getTime() - b.transactionTime.getTime() ||
      a.id.localeCompare(b.id)
  );

  for (const transaction of sortedTransactions) {
    validateTransaction(transaction);

    if (transaction.transactionType === "ADD") {
      const spirit = spiritsById.get(transaction.spiritId ?? "");
      if (!spirit) {
        throw new Error(`Unknown spirit for transaction ${transaction.id}.`);
      }
      validateSpirit(spirit);
      const existing = components.get(spirit.id) ?? {
        spirit,
        remainingVolumeMl: 0,
        remainingEthanolMl: 0
      };
      existing.remainingVolumeMl += transaction.amountMl;
      existing.remainingEthanolMl += transaction.amountMl * (spirit.abvPercent / 100);
      components.set(spirit.id, existing);
    } else {
      const totalVolumeMl = totalVolume([...components.values()]);
      if (transaction.amountMl > totalVolumeMl + 0.000001) {
        throw new Error("Cannot remove more volume than exists in the bottle.");
      }
      const removalFraction = transaction.amountMl / totalVolumeMl;
      for (const [spiritId, component] of components) {
        component.remainingVolumeMl *= 1 - removalFraction;
        component.remainingEthanolMl *= 1 - removalFraction;
        if (component.remainingVolumeMl < 0.000001) {
          components.delete(spiritId);
        }
      }
    }

    snapshots.push(createSnapshot(transaction, [...components.values()]));
  }

  const finalComponents = [...components.values()].sort((a, b) =>
    a.spirit.displayName.localeCompare(b.spirit.displayName)
  );

  return {
    components: finalComponents,
    snapshots,
    current: snapshots.at(-1) ?? null
  };
}

export function createSnapshot(
  transaction: BottleLedgerTransaction,
  components: BottleComponentState[]
): BottleSnapshotState {
  const totalVolumeMl = totalVolume(components);
  const totalEthanolMl = components.reduce((total, component) => total + component.remainingEthanolMl, 0);
  const abvPercent = totalVolumeMl > 0 ? (totalEthanolMl / totalVolumeMl) * 100 : 0;
  const proof = abvPercent * 2;
  const componentBreakdown = calculateComponentBreakdown(components, totalVolumeMl);

  return {
    transactionId: transaction.id,
    snapshotTime: transaction.transactionTime,
    totalVolumeMl,
    totalEthanolMl,
    abvPercent,
    proof,
    componentBreakdown,
    categoryBreakdown: calculateCategoryBreakdown(componentBreakdown, totalVolumeMl),
    mashBill: calculateMashBill(components),
    flavorProfile: calculateFlavorProfile(components)
  };
}

export function calculateComponentBreakdown(
  components: BottleComponentState[],
  totalVolumeMl = totalVolume(components)
): ComponentBreakdown[] {
  return components
    .map((component) => ({
      spiritId: component.spirit.id,
      displayName: component.spirit.displayName,
      category: component.spirit.category,
      remainingVolumeMl: component.remainingVolumeMl,
      remainingEthanolMl: component.remainingEthanolMl,
      abvPercent:
        component.remainingVolumeMl > 0
          ? (component.remainingEthanolMl / component.remainingVolumeMl) * 100
          : 0,
      proof:
        component.remainingVolumeMl > 0
          ? (component.remainingEthanolMl / component.remainingVolumeMl) * 200
          : 0,
      sharePct: totalVolumeMl > 0 ? (component.remainingVolumeMl / totalVolumeMl) * 100 : 0
    }))
    .sort((a, b) => b.sharePct - a.sharePct);
}

export function calculateCategoryBreakdown(
  components: ComponentBreakdown[],
  totalVolumeMl: number
): CategoryBreakdown[] {
  const categories = new Map<string, number>();
  for (const component of components) {
    categories.set(component.category, (categories.get(component.category) ?? 0) + component.remainingVolumeMl);
  }
  return [...categories.entries()]
    .map(([category, remainingVolumeMl]) => ({
      category,
      remainingVolumeMl,
      sharePct: totalVolumeMl > 0 ? (remainingVolumeMl / totalVolumeMl) * 100 : 0
    }))
    .sort((a, b) => b.sharePct - a.sharePct);
}

export function calculateMashBill(components: BottleComponentState[]): MashBillEstimate {
  const totalVolumeMl = totalVolume(components);
  const estimate: MashBillEstimate = {
    cornPct: null,
    ryePct: null,
    wheatPct: null,
    maltedBarleyPct: null,
    otherGrainPct: null,
    confidence: null,
    notes: []
  };

  if (totalVolumeMl <= 0) return estimate;

  for (const field of grainFields) {
    let knownVolumeMl = 0;
    let weighted = 0;
    for (const component of components) {
      const value = component.spirit[field];
      if (value != null) {
        knownVolumeMl += component.remainingVolumeMl;
        weighted += component.remainingVolumeMl * value;
      }
    }
    estimate[field] = knownVolumeMl > 0 ? weighted / knownVolumeMl : null;
  }

  const confidenceInputs = components
    .filter((component) => component.spirit.mashBillConfidence != null)
    .map((component) => ({
      volume: component.remainingVolumeMl,
      confidence: component.spirit.mashBillConfidence ?? 0
    }));
  const confidenceVolume = confidenceInputs.reduce((total, item) => total + item.volume, 0);
  estimate.confidence =
    confidenceVolume > 0
      ? confidenceInputs.reduce((total, item) => total + item.volume * item.confidence, 0) / confidenceVolume
      : null;

  estimate.notes = [
    ...new Set(
      components
        .map((component) => component.spirit.mashBillNotes)
        .filter((note): note is string => Boolean(note))
    )
  ];

  return estimate;
}

export function calculateFlavorProfile(components: BottleComponentState[]): FlavorProfile {
  const totalVolumeMl = totalVolume(components);
  if (totalVolumeMl <= 0) return { ...emptyFlavorProfile };

  const profile = { ...emptyFlavorProfile };
  for (const dimension of flavorDimensions) {
    let weighted = 0;
    for (const component of components) {
      weighted += component.remainingVolumeMl * (component.spirit.flavor?.[dimension] ?? 0);
    }
    profile[dimension] = weighted / totalVolumeMl;
  }
  return profile;
}

function totalVolume(components: BottleComponentState[]): number {
  return components.reduce((total, component) => total + component.remainingVolumeMl, 0);
}
