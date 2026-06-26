import { z } from "zod";

export const spiritLookupEnabled = Boolean(process.env.OPENAI_API_KEY);

export const SpiritLookupSchema = z.object({
  canonicalName: z.string(),
  displayName: z.string(),
  brand: z.string().nullable().optional(),
  producer: z.string().nullable().optional(),
  category: z.string(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  abvPercent: z.number().positive().max(95).nullable().optional(),
  proof: z.number().positive().max(190).nullable().optional(),
  ageYears: z.number().positive().nullable().optional(),
  cornPct: z.number().min(0).max(100).nullable().optional(),
  ryePct: z.number().min(0).max(100).nullable().optional(),
  wheatPct: z.number().min(0).max(100).nullable().optional(),
  maltedBarleyPct: z.number().min(0).max(100).nullable().optional(),
  otherGrainPct: z.number().min(0).max(100).nullable().optional(),
  mashBillConfidence: z.number().min(0).max(1).nullable().optional(),
  mashBillNotes: z.string().nullable().optional(),
  flavor: z.object({
    sweet: z.number().min(0).max(5),
    vanilla: z.number().min(0).max(5),
    caramel: z.number().min(0).max(5),
    oak: z.number().min(0).max(5),
    spice: z.number().min(0).max(5),
    fruit: z.number().min(0).max(5),
    smoke: z.number().min(0).max(5),
    peat: z.number().min(0).max(5),
    nutty: z.number().min(0).max(5),
    floral: z.number().min(0).max(5)
  }),
  sourceConfidence: z.number().min(0).max(1),
  warnings: z.array(z.string())
});

export type SpiritLookupDraft = z.infer<typeof SpiritLookupSchema>;

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function lookupSpiritWithOpenAI(name: string): Promise<SpiritLookupDraft> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: spiritLookupSystemPrompt
        },
        {
          role: "user",
          content: `Complete draft metadata for this bottle in a user's home bar: ${name}`
        }
      ]
    })
  });

  const json = (await response.json()) as OpenAIChatCompletionResponse;
  if (!response.ok) {
    throw new Error(json.error?.message ?? "OpenAI spirit lookup failed.");
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no spirit metadata.");
  return SpiritLookupSchema.parse(JSON.parse(content));
}

export const spiritLookupSystemPrompt = `You are helping SoleraVault complete editable draft metadata for a liquor bottle in a user's home bar.

Return only valid JSON matching this exact shape:
{
  "canonicalName": "string",
  "displayName": "string",
  "brand": "string or null",
  "producer": "string or null",
  "category": "string",
  "country": "string or null",
  "region": "string or null",
  "abvPercent": number or null,
  "proof": number or null,
  "ageYears": number or null,
  "cornPct": number or null,
  "ryePct": number or null,
  "wheatPct": number or null,
  "maltedBarleyPct": number or null,
  "otherGrainPct": number or null,
  "mashBillConfidence": number or null,
  "mashBillNotes": "string or null",
  "flavor": {
    "sweet": number,
    "vanilla": number,
    "caramel": number,
    "oak": number,
    "spice": number,
    "fruit": number,
    "smoke": number,
    "peat": number,
    "nutty": number,
    "floral": number
  },
  "sourceConfidence": number,
  "warnings": ["string"]
}

Accuracy rules:
- Treat the result as draft metadata for user review, not authoritative truth.
- Prefer well-known label facts: official bottle proof/ABV, producer, region, category, and stated age.
- Do not invent exact mash bills. Use grain percentages only when widely published or strongly established for that exact product. Otherwise set unknown grain fields to null.
- If a mash bill is approximate, proprietary, inferred from category rules, or varies by market/batch, lower mashBillConfidence and explain that in mashBillNotes and warnings.
- If the user's bottle name is ambiguous, could refer to multiple releases, or proof varies by batch/barrel/market, include warnings and lower sourceConfidence.
- ABV is a percentage like 50.5, not 0.505. Proof equals ABV percent times 2 for US proof.
- Flavor values are approximate 0-5 tasting dimensions for blending analytics. Use reasonable style-based estimates and keep them conservative.
- Confidence values must be 0-1. Use high confidence only for stable label facts on an unambiguous product.
- Never cite private or scraped sources. If uncertain, return nulls and warnings rather than guessing.`;
