import OpenAI from "openai";
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

export async function lookupSpiritWithOpenAI(name: string): Promise<SpiritLookupDraft> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Return draft JSON metadata for a spirit. Do not invent exact mash bills. If proof varies by batch or the bottle is ambiguous, add warnings and lower confidence. Flavor values are 0-5. Confidence values are 0-1."
      },
      {
        role: "user",
        content: `Look up draft metadata for: ${name}`
      }
    ]
  });

  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("OpenAI returned no spirit metadata.");
  return SpiritLookupSchema.parse(JSON.parse(content));
}
