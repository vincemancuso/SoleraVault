import { describe, expect, it } from "vitest";
import { replayBottleLedger, type BottleLedgerTransaction, type SpiritInput } from "@/lib/blendMath";

const bourbon: SpiritInput = {
  id: "bourbon",
  displayName: "Test Bourbon",
  category: "Bourbon",
  abvPercent: 50,
  cornPct: 70,
  ryePct: 20,
  maltedBarleyPct: 10,
  mashBillConfidence: 0.8,
  flavor: { sweet: 4, vanilla: 3, caramel: 4, oak: 2, spice: 2, fruit: 2, smoke: 0, peat: 0, nutty: 1, floral: 1 }
};

const rye: SpiritInput = {
  id: "rye",
  displayName: "Test Rye",
  category: "Rye",
  abvPercent: 40,
  cornPct: 39,
  ryePct: 51,
  maltedBarleyPct: 10,
  mashBillConfidence: 0.6,
  flavor: { sweet: 2, vanilla: 1, caramel: 2, oak: 3, spice: 5, fruit: 1, smoke: 0, peat: 0, nutty: 2, floral: 1 }
};

const spirits = new Map([
  [bourbon.id, bourbon],
  [rye.id, rye]
]);

function tx(id: string, transactionType: "ADD" | "REMOVE", amountMl: number, spiritId?: string): BottleLedgerTransaction {
  return {
    id,
    transactionType,
    amountMl,
    spiritId,
    transactionTime: new Date(`2025-01-0${id.length}T12:00:00Z`)
  };
}

describe("blend math", () => {
  it("adding a single spirit updates volume, ethanol, ABV, and proof", () => {
    const result = replayBottleLedger([tx("a", "ADD", 100, "bourbon")], spirits);
    expect(result.current?.totalVolumeMl).toBeCloseTo(100);
    expect(result.current?.totalEthanolMl).toBeCloseTo(50);
    expect(result.current?.abvPercent).toBeCloseTo(50);
    expect(result.current?.proof).toBeCloseTo(100);
  });

  it("adding multiple spirits calculates weighted proof correctly", () => {
    const result = replayBottleLedger([tx("a", "ADD", 100, "bourbon"), tx("bb", "ADD", 100, "rye")], spirits);
    expect(result.current?.abvPercent).toBeCloseTo(45);
    expect(result.current?.proof).toBeCloseTo(90);
  });

  it("removing a pour proportionally reduces all components", () => {
    const result = replayBottleLedger([tx("a", "ADD", 100, "bourbon"), tx("bb", "REMOVE", 25)], spirits);
    expect(result.components[0].remainingVolumeMl).toBeCloseTo(75);
    expect(result.components[0].remainingEthanolMl).toBeCloseTo(37.5);
  });

  it("removing from a mixed bottle preserves component percentages", () => {
    const result = replayBottleLedger([tx("a", "ADD", 100, "bourbon"), tx("bb", "ADD", 100, "rye"), tx("ccc", "REMOVE", 50)], spirits);
    expect(result.current?.componentBreakdown[0].sharePct).toBeCloseTo(50);
    expect(result.current?.componentBreakdown[1].sharePct).toBeCloseTo(50);
  });

  it("cannot remove more than current volume", () => {
    expect(() => replayBottleLedger([tx("a", "ADD", 100, "bourbon"), tx("bb", "REMOVE", 101)], spirits)).toThrow(/Cannot remove/);
  });

  it("ledger replay produces correct final state after multiple adds and removes", () => {
    const result = replayBottleLedger([tx("a", "ADD", 100, "bourbon"), tx("bb", "ADD", 50, "rye"), tx("ccc", "REMOVE", 30)], spirits);
    expect(result.current?.totalVolumeMl).toBeCloseTo(120);
    expect(result.current?.proof).toBeCloseTo(93.333333);
    expect(result.snapshots).toHaveLength(3);
  });

  it("editing or deleting transactions followed by replay produces expected state", () => {
    const original = [tx("a", "ADD", 100, "bourbon"), tx("bb", "ADD", 100, "rye"), tx("ccc", "REMOVE", 50)];
    const edited = [tx("a", "ADD", 100, "bourbon"), tx("bb", "ADD", 50, "rye")];
    expect(replayBottleLedger(original, spirits).current?.totalVolumeMl).toBeCloseTo(150);
    expect(replayBottleLedger(edited, spirits).current?.totalVolumeMl).toBeCloseTo(150);
    expect(replayBottleLedger(edited, spirits).current?.proof).toBeCloseTo(93.333333);
  });

  it("flavor profile is volume-weighted correctly", () => {
    const result = replayBottleLedger([tx("a", "ADD", 100, "bourbon"), tx("bb", "ADD", 100, "rye")], spirits);
    expect(result.current?.flavorProfile.sweet).toBeCloseTo(3);
    expect(result.current?.flavorProfile.spice).toBeCloseTo(3.5);
  });

  it("mash bill estimate is volume-weighted correctly", () => {
    const result = replayBottleLedger([tx("a", "ADD", 100, "bourbon"), tx("bb", "ADD", 100, "rye")], spirits);
    expect(result.current?.mashBill.cornPct).toBeCloseTo(54.5);
    expect(result.current?.mashBill.ryePct).toBeCloseTo(35.5);
    expect(result.current?.mashBill.maltedBarleyPct).toBeCloseTo(10);
  });
});
