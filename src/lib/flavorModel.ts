export const flavorDimensions = [
  "sweet",
  "vanilla",
  "caramel",
  "oak",
  "spice",
  "fruit",
  "smoke",
  "peat",
  "nutty",
  "floral"
] as const;

export type FlavorDimension = (typeof flavorDimensions)[number];
export type FlavorProfile = Record<FlavorDimension, number>;

export const emptyFlavorProfile: FlavorProfile = Object.fromEntries(
  flavorDimensions.map((dimension) => [dimension, 0])
) as FlavorProfile;

export function clampFlavorValue(value: number): number {
  return Math.min(5, Math.max(0, value));
}
