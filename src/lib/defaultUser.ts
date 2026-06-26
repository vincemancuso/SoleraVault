import { prisma } from "@/lib/prisma";

export const DEFAULT_USER_EMAIL = "owner@soleravault.local";

export async function getOrCreateDefaultUser() {
  return prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: {
      email: DEFAULT_USER_EMAIL,
      displayName: "SoleraVault Owner"
    }
  });
}
