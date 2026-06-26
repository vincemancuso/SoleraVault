export const ML_PER_OUNCE = 29.5735295625;

export type VolumeUnit = "ml" | "oz";

export function toMl(amount: number, unit: VolumeUnit): number {
  return unit === "oz" ? amount * ML_PER_OUNCE : amount;
}

export function fromMl(amountMl: number, unit: VolumeUnit): number {
  return unit === "oz" ? amountMl / ML_PER_OUNCE : amountMl;
}

export function formatMlAsOz(amountMl: number): string {
  return `${fromMl(amountMl, "oz").toFixed(1)} oz`;
}

export function formatMl(amountMl: number): string {
  return `${Math.round(amountMl)} ml`;
}
