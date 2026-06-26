"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, TransactionType } from "@prisma/client";
import { getOrCreateDefaultUser } from "@/lib/defaultUser";
import { lookupSpiritWithOpenAI } from "@/lib/openaiSpiritLookup";
import { prisma } from "@/lib/prisma";
import { replayBottle } from "@/lib/bottleService";
import { toMl, type VolumeUnit } from "@/lib/units";

function numberFromForm(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function nullableNumberFromForm(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function stringFromForm(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createBottle(formData: FormData) {
  const user = await getOrCreateDefaultUser();
  const targetUnit = (formData.get("targetUnit") as VolumeUnit) || "ml";
  const bottle = await prisma.bottle.create({
    data: {
      userId: user.id,
      name: stringFromForm(formData, "name"),
      description: stringFromForm(formData, "description") || null,
      targetVolumeMl: toMl(numberFromForm(formData, "targetVolume"), targetUnit)
    }
  });
  revalidatePath("/");
  redirect(`/bottles/${bottle.id}`);
}

export async function updateBottle(bottleId: string, formData: FormData) {
  const targetUnit = (formData.get("targetUnit") as VolumeUnit) || "ml";
  await prisma.bottle.update({
    where: { id: bottleId },
    data: {
      name: stringFromForm(formData, "name"),
      description: stringFromForm(formData, "description") || null,
      targetVolumeMl: toMl(numberFromForm(formData, "targetVolume"), targetUnit)
    }
  });
  revalidatePath("/");
  revalidatePath(`/bottles/${bottleId}`);
  redirect(`/bottles/${bottleId}`);
}

export async function archiveBottle(bottleId: string) {
  await prisma.bottle.update({ where: { id: bottleId }, data: { archivedAt: new Date() } });
  revalidatePath("/");
  redirect("/");
}

export async function deleteBottle(bottleId: string) {
  await prisma.bottle.delete({ where: { id: bottleId } });
  revalidatePath("/");
  redirect("/");
}

export async function createSpirit(formData: FormData) {
  const user = await getOrCreateDefaultUser();
  const spirit = await prisma.spirit.create({
    data: {
      ...spiritDataFromForm(formData),
      userVerified: formData.get("userVerified") === "on",
      createdByUserId: user.id,
      flavor: {
        create: flavorDataFromForm(formData)
      }
    }
  });
  revalidatePath("/spirits");
  redirect(`/spirits?created=${spirit.id}`);
}

export async function updateSpirit(spiritId: string, formData: FormData) {
  await prisma.spirit.update({
    where: { id: spiritId },
    data: {
      ...spiritDataFromForm(formData),
      userVerified: formData.get("userVerified") === "on",
      flavor: {
        upsert: {
          create: flavorDataFromForm(formData),
          update: flavorDataFromForm(formData)
        }
      }
    }
  });

  const affectedBottles = await prisma.bottleTransaction.findMany({
    where: { spiritId },
    distinct: ["bottleId"],
    select: { bottleId: true }
  });

  for (const bottle of affectedBottles) {
    await replayBottle(bottle.bottleId);
    revalidatePath(`/bottles/${bottle.bottleId}`);
  }

  revalidatePath("/spirits");
  redirect("/spirits");
}

export async function deleteSpirit(spiritId: string) {
  const transactionCount = await prisma.bottleTransaction.count({ where: { spiritId } });
  if (transactionCount > 0) {
    redirect("/spirits?removeError=used");
  }

  await prisma.spirit.delete({ where: { id: spiritId } });
  revalidatePath("/spirits");
  redirect("/spirits");
}

export async function addBottleTransaction(bottleId: string, formData: FormData) {
  const unit = (formData.get("unit") as VolumeUnit) || "ml";
  await prisma.bottleTransaction.create({
    data: {
      bottleId,
      transactionType: TransactionType.ADD,
      spiritId: stringFromForm(formData, "spiritId"),
      amountMl: toMl(numberFromForm(formData, "amount"), unit),
      transactionTime: new Date(stringFromForm(formData, "transactionTime") || Date.now()),
      notes: stringFromForm(formData, "notes") || null
    }
  });
  await replayBottle(bottleId);
  revalidatePath(`/bottles/${bottleId}`);
  redirect(`/bottles/${bottleId}`);
}

export async function removeBottleTransaction(bottleId: string, formData: FormData) {
  const unit = (formData.get("unit") as VolumeUnit) || "ml";
  await prisma.bottleTransaction.create({
    data: {
      bottleId,
      transactionType: TransactionType.REMOVE,
      spiritId: null,
      amountMl: toMl(numberFromForm(formData, "amount"), unit),
      transactionTime: new Date(stringFromForm(formData, "transactionTime") || Date.now()),
      notes: stringFromForm(formData, "notes") || null
    }
  });
  await replayBottle(bottleId);
  revalidatePath(`/bottles/${bottleId}`);
  redirect(`/bottles/${bottleId}`);
}

export async function deleteTransaction(bottleId: string, transactionId: string) {
  await prisma.bottleTransaction.delete({ where: { id: transactionId } });
  await replayBottle(bottleId);
  revalidatePath(`/bottles/${bottleId}`);
}

export async function updateTransaction(bottleId: string, transactionId: string, formData: FormData) {
  const unit = (formData.get("unit") as VolumeUnit) || "ml";
  const transactionType = formData.get("transactionType") as TransactionType;
  await prisma.bottleTransaction.update({
    where: { id: transactionId },
    data: {
      transactionType,
      spiritId: transactionType === TransactionType.ADD ? stringFromForm(formData, "spiritId") : null,
      amountMl: toMl(numberFromForm(formData, "amount"), unit),
      transactionTime: new Date(stringFromForm(formData, "transactionTime") || Date.now()),
      notes: stringFromForm(formData, "notes") || null
    }
  });
  await replayBottle(bottleId);
  revalidatePath(`/bottles/${bottleId}`);
}

export async function aiLookupSpirit(formData: FormData) {
  const draft = await lookupSpiritWithOpenAI(stringFromForm(formData, "lookupName"));
  return draft;
}

function spiritDataFromForm(formData: FormData): Prisma.SpiritUncheckedCreateInput {
  const displayName = stringFromForm(formData, "displayName");
  const abvPercent = numberFromForm(formData, "abvPercent");
  return {
    canonicalName: stringFromForm(formData, "canonicalName") || displayName.toLowerCase(),
    displayName,
    brand: stringFromForm(formData, "brand") || null,
    producer: stringFromForm(formData, "producer") || null,
    category: stringFromForm(formData, "category") || "Whiskey",
    country: stringFromForm(formData, "country") || null,
    region: stringFromForm(formData, "region") || null,
    abvPercent,
    proof: abvPercent * 2,
    ageYears: nullableNumberFromForm(formData, "ageYears"),
    cornPct: nullableNumberFromForm(formData, "cornPct"),
    ryePct: nullableNumberFromForm(formData, "ryePct"),
    wheatPct: nullableNumberFromForm(formData, "wheatPct"),
    maltedBarleyPct: nullableNumberFromForm(formData, "maltedBarleyPct"),
    otherGrainPct: nullableNumberFromForm(formData, "otherGrainPct"),
    mashBillConfidence: nullableNumberFromForm(formData, "mashBillConfidence"),
    mashBillNotes: stringFromForm(formData, "mashBillNotes") || null,
    dataSource: stringFromForm(formData, "dataSource") || "manual",
    sourceConfidence: nullableNumberFromForm(formData, "sourceConfidence")
  };
}

function flavorDataFromForm(formData: FormData): Prisma.SpiritFlavorProfileCreateWithoutSpiritInput {
  return {
    sweet: numberFromForm(formData, "sweet"),
    vanilla: numberFromForm(formData, "vanilla"),
    caramel: numberFromForm(formData, "caramel"),
    oak: numberFromForm(formData, "oak"),
    spice: numberFromForm(formData, "spice"),
    fruit: numberFromForm(formData, "fruit"),
    smoke: numberFromForm(formData, "smoke"),
    peat: numberFromForm(formData, "peat"),
    nutty: numberFromForm(formData, "nutty"),
    floral: numberFromForm(formData, "floral")
  };
}
