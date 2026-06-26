import type { FlavorProfile } from "@/lib/flavorModel";

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  abbreviated_product_name?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  countries?: string;
  countries_tags?: string[];
  quantity?: string;
  labels?: string;
  nutriments?: {
    alcohol?: number;
    alcohol_100g?: number;
  };
};

type OpenFoodFactsResponse = {
  status: "success" | "failure";
  result?: {
    id?: string;
    product?: OpenFoodFactsProduct;
  };
  product?: OpenFoodFactsProduct;
};

export type OpenFoodFactsSpiritDraft = {
  barcode: string;
  displayName: string;
  canonicalName: string;
  brand: string;
  producer: string;
  category: string;
  country: string;
  region: string;
  abvPercent: number;
  dataSource: "open_food_facts";
  sourceConfidence: number;
  mashBillNotes: string;
  flavor: Partial<FlavorProfile>;
  warnings: string[];
};

export async function lookupOpenFoodFactsByBarcode(barcode: string): Promise<OpenFoodFactsSpiritDraft | null> {
  const cleanBarcode = barcode.replace(/\D/g, "");
  if (!cleanBarcode) return null;

  const response = await fetch(`https://world.openfoodfacts.org/api/v3/product/${cleanBarcode}.json`, {
    headers: {
      "User-Agent": "SoleraVault/0.1 (https://github.com/vincemancuso/SoleraVault)"
    },
    next: { revalidate: 60 * 60 * 24 }
  });

  if (!response.ok) return null;

  const json = (await response.json()) as OpenFoodFactsResponse;
  const product = json.result?.product ?? json.product;
  if (!product) return null;

  const displayName =
    product.product_name_en ||
    product.product_name ||
    product.abbreviated_product_name ||
    `Barcode ${cleanBarcode}`;
  const brands = splitFirst(product.brands);
  const category = inferCategory(product.categories_tags ?? [], product.categories);
  const abv = Number(product.nutriments?.alcohol ?? product.nutriments?.alcohol_100g ?? 40);
  const hasAlcohol = Number.isFinite(abv) && abv > 0;
  const warnings = [
    "Open Food Facts data is crowd-sourced; review every imported field.",
    ...(hasAlcohol ? [] : ["ABV was not present in Open Food Facts, so 40% was used as a placeholder."]),
    "Mash bill and flavor profile are not provided by Open Food Facts."
  ];

  return {
    barcode: cleanBarcode,
    displayName,
    canonicalName: displayName.toLowerCase(),
    brand: brands,
    producer: brands,
    category,
    country: formatCountry(splitFirst(product.countries) || splitFirst(product.countries_tags?.join(","))),
    region: "",
    abvPercent: hasAlcohol ? Math.min(95, abv) : 40,
    dataSource: "open_food_facts",
    sourceConfidence: hasAlcohol ? 0.55 : 0.35,
    mashBillNotes: `Imported from Open Food Facts barcode ${cleanBarcode}. Product metadata is draft-only; mash bill remains unknown.`,
    flavor: {
      sweet: 2,
      vanilla: 2,
      caramel: 2,
      oak: 2,
      spice: 2,
      fruit: 2,
      smoke: 0,
      peat: 0,
      nutty: 2,
      floral: 1
    },
    warnings
  };
}

function splitFirst(value?: string): string {
  return value?.split(",")[0]?.trim() ?? "";
}

function inferCategory(tags: string[], categories?: string): string {
  const joined = [...tags, categories ?? ""].join(" ").toLowerCase();
  if (joined.includes("bourbon")) return "Bourbon";
  if (joined.includes("rye")) return "Rye Whiskey";
  if (joined.includes("scotch")) return "Scotch Whisky";
  if (joined.includes("whisky") || joined.includes("whiskey")) return "Whiskey";
  if (joined.includes("rum")) return "Rum";
  if (joined.includes("gin")) return "Gin";
  if (joined.includes("vodka")) return "Vodka";
  if (joined.includes("tequila")) return "Tequila";
  if (joined.includes("spirits") || joined.includes("alcohol")) return "Spirit";
  return "Spirit";
}

function formatCountry(value: string): string {
  return value.replace(/^en:/, "").replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
