import { PrismaClient } from "@prisma/client";
import { DEFAULT_USER_EMAIL } from "../src/lib/defaultUser";

const prisma = new PrismaClient();

const spirits = [
  ["Wild Turkey 101 Bourbon", "Wild Turkey", "Bourbon", 50.5, "United States", "Kentucky", [75, 13, null, 12, null], 0.7, [3.7, 3.3, 3.6, 3.2, 3.8, 2.2, 1.1, 0, 2.4, 0.8]],
  ["Buffalo Trace Bourbon", "Buffalo Trace", "Bourbon", 45, "United States", "Kentucky", [null, null, null, null, null], 0.2, [3.4, 3.2, 3.8, 2.6, 2.2, 2.6, 0.5, 0, 1.8, 1.0]],
  ["Maker's Mark Bourbon", "Maker's Mark", "Wheated Bourbon", 45, "United States", "Kentucky", [70, 0, 16, 14, null], 0.7, [4.0, 3.4, 3.6, 2.4, 1.4, 2.4, 0.4, 0, 2.1, 1.0]],
  ["Four Roses Small Batch Bourbon", "Four Roses", "Bourbon", 45, "United States", "Kentucky", [null, null, null, null, null], 0.2, [3.1, 2.8, 3.1, 2.7, 3.3, 3.1, 0.4, 0, 1.6, 1.7]],
  ["Old Grand-Dad Bonded Bourbon", "Jim Beam", "High-Rye Bourbon", 50, "United States", "Kentucky", [63, 27, null, 10, null], 0.7, [3.0, 2.5, 3.2, 3.0, 4.2, 1.9, 0.8, 0, 2.0, 0.8]],
  ["Rittenhouse Rye", "Heaven Hill", "Rye Whiskey", 50, "United States", "Kentucky", [37, 51, null, 12, null], 0.7, [2.6, 2.4, 2.8, 3.1, 4.5, 2.0, 0.7, 0, 2.1, 0.7]],
  ["Bulleit Bourbon", "Bulleit", "High-Rye Bourbon", 45, "United States", "Kentucky", [68, 28, null, 4, null], 0.6, [3.0, 2.7, 3.1, 2.8, 3.8, 2.2, 0.6, 0, 1.7, 0.8]],
  ["Woodford Reserve Bourbon", "Woodford Reserve", "Bourbon", 45.2, "United States", "Kentucky", [72, 18, null, 10, null], 0.7, [3.6, 3.4, 3.7, 3.0, 2.8, 2.8, 0.6, 0, 2.2, 1.0]],
  ["Evan Williams Bottled-in-Bond", "Heaven Hill", "Bourbon", 50, "United States", "Kentucky", [78, 10, null, 12, null], 0.6, [3.3, 2.8, 3.5, 2.8, 2.3, 1.8, 0.7, 0, 1.8, 0.6]],
  ["Laphroaig 10 Year Single Malt Scotch", "Laphroaig", "Single Malt Scotch", 43, "Scotland", "Islay", [null, null, null, 100, null], 0.9, [1.5, 1.1, 1.8, 3.3, 2.2, 2.0, 4.8, 4.7, 1.8, 1.3]],
  ["Ardbeg 10 Year Single Malt Scotch", "Ardbeg", "Single Malt Scotch", 46, "Scotland", "Islay", [null, null, null, 100, null], 0.9, [1.7, 1.2, 2.0, 3.5, 2.5, 2.2, 4.6, 4.5, 1.7, 1.2]],
  ["Jameson Irish Whiskey", "Jameson", "Irish Whiskey", 40, "Ireland", null, [null, null, null, null, null], 0.2, [3.0, 2.6, 2.8, 1.8, 1.5, 2.5, 0.3, 0, 1.8, 1.2]],
  ["Redbreast 12 Year Irish Whiskey", "Redbreast", "Single Pot Still Irish Whiskey", 40, "Ireland", null, [null, null, null, null, null], 0.2, [3.6, 3.0, 3.2, 2.4, 2.2, 3.2, 0.3, 0, 2.6, 1.4]]
] as const;

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: { email: DEFAULT_USER_EMAIL, displayName: "SoleraVault Owner" }
  });

  for (const [displayName, producer, category, abvPercent, country, region, mash, confidence, flavor] of spirits) {
    await prisma.spirit.upsert({
      where: { canonicalName: displayName.toLowerCase() },
      update: {},
      create: {
        canonicalName: displayName.toLowerCase(),
        displayName,
        brand: displayName.split(" ")[0],
        producer,
        category,
        country,
        region,
        abvPercent,
        proof: abvPercent * 2,
        cornPct: mash[0],
        ryePct: mash[1],
        wheatPct: mash[2],
        maltedBarleyPct: mash[3],
        otherGrainPct: mash[4],
        mashBillConfidence: confidence,
        mashBillNotes: confidence < 0.5 ? "Mash bill is not public or varies; left mostly unknown." : "Approximate commonly cited mash bill.",
        dataSource: "seed",
        sourceConfidence: confidence,
        userVerified: false,
        createdByUserId: user.id,
        flavor: {
          create: {
            sweet: flavor[0],
            vanilla: flavor[1],
            caramel: flavor[2],
            oak: flavor[3],
            spice: flavor[4],
            fruit: flavor[5],
            smoke: flavor[6],
            peat: flavor[7],
            nutty: flavor[8],
            floral: flavor[9]
          }
        }
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
