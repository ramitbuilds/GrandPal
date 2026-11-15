import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPasscode, checkRateLimit, getClientIdentifier } from "@/lib/securityHarness";
import { Medication } from "@/lib/types";

interface OnboardingMedicationInput {
  name: string;
  dosage?: string;
  timeOfDay?: string;
  instructions?: string;
}

interface OnboardingRequestBody {
  name?: string;
  age?: number | string;
  caregiverEmail?: string;
  pin?: string;
  medications?: OnboardingMedicationInput[];
}

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const rateCheck = checkRateLimit(`onboarding_${clientId}`, 15, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many onboarding requests. Please wait a moment." },
      { status: 429 }
    );
  }

  let body: OnboardingRequestBody = {};
  try {
    body = (await req.json()) as OnboardingRequestBody;
  } catch {
    body = {};
  }

  const { name, age, caregiverEmail, pin, medications } = body;
  const seniorName = (name && String(name).trim()) || "Grandma Mary";
  const seniorAge = Number(age) || 75;
  const email = (caregiverEmail && String(caregiverEmail).trim()) || "caregiver@example.com";
  const passcode = (pin && String(pin).trim()) || "1234";
  const passcodeHash = hashPasscode(passcode);

  const medList: OnboardingMedicationInput[] =
    Array.isArray(medications) && medications.length > 0
      ? medications.filter(
          (m): m is OnboardingMedicationInput =>
            Boolean(m) && typeof m.name === "string" && m.name.trim().length > 0
        )
      : [
          {
            name: "Lisinopril",
            dosage: "10mg",
            timeOfDay: "Morning",
            instructions: "Take 1 tablet with water after breakfast.",
          },
        ];

  try {
    // Find existing profile or create new
    let senior = await prisma.seniorProfile.findFirst();

    if (senior) {
      senior = await prisma.seniorProfile.update({
        where: { id: senior.id },
        data: {
          name: seniorName,
          age: seniorAge,
          caregiverEmail: email,
          passcodeHash: passcodeHash,
          streakDays: 1,
        },
      });

      // Clear old demo medications and logs for a clean new slate
      await prisma.doseLog.deleteMany({ where: { seniorId: senior.id } });
      await prisma.medication.deleteMany({ where: { seniorId: senior.id } });
    } else {
      senior = await prisma.seniorProfile.create({
        data: {
          name: seniorName,
          age: seniorAge,
          caregiverEmail: email,
          passcodeHash: passcodeHash,
          streakDays: 1,
        },
      });
    }

    const today = new Date();
    today.setHours(9, 0, 0, 0);

    const createdMeds = [];
    for (const med of medList) {
      const createdMed = await prisma.medication.create({
        data: {
          seniorId: senior.id,
          name: med.name.trim(),
          dosage: med.dosage?.trim() || "1 tablet",
          timeOfDay: med.timeOfDay || "Morning",
          instructions: med.instructions?.trim() || "Take with water as directed.",
          color: "bg-amber-100 text-amber-900 border-amber-300",
          shape: "pill",
          active: true,
        },
      });

      await prisma.doseLog.create({
        data: {
          seniorId: senior.id,
          medicationId: createdMed.id,
          scheduledFor: today,
          status: "PENDING",
        },
      });

      createdMeds.push(createdMed);
    }

    try {
      await prisma.adaptiveMemory.create({
        data: {
          seniorId: senior.id,
          category: "PERSONAL_PREFERENCE",
          keyFact: `Onboarding completed for ${seniorName}. Doctor Pup is ready to assist daily.`,
        },
      });
    } catch {
      // Non-critical memory logging
    }

    return NextResponse.json({
      success: true,
      seniorId: senior.id,
      name: seniorName,
    });
  } catch (error) {
    console.error("Database write error during onboarding (using resilient fallback):", error);

    // Fallback: construct in-memory resilient profile so client is never blocked
    const fallbackSeniorId = `senior-${Date.now()}`;
    const fallbackMeds: Medication[] = medList.map((m, idx) => ({
      id: `med-${Date.now()}-${idx}`,
      seniorId: fallbackSeniorId,
      name: String(m.name).trim(),
      dosage: m.dosage ? String(m.dosage).trim() : "1 tablet",
      timeOfDay: m.timeOfDay || "Morning",
      instructions: m.instructions ? String(m.instructions).trim() : "Take with water as directed.",
      color: "bg-amber-100 text-amber-900 border-amber-300",
      shape: "pill",
      active: true,
    }));

    const fallbackDoses = fallbackMeds.map((med) => ({
      id: `dose-${med.id}`,
      seniorId: fallbackSeniorId,
      medicationId: med.id,
      scheduledFor: new Date().toISOString(),
      status: "PENDING",
    }));

    const fallbackSenior = {
      id: fallbackSeniorId,
      name: seniorName,
      age: seniorAge,
      caregiverEmail: email,
      passcodeHash: passcodeHash,
      streakDays: 1,
      medications: fallbackMeds,
      doseLogs: fallbackDoses,
      appointments: [],
      memories: [
        {
          id: `mem-${Date.now()}`,
          category: "PERSONAL_PREFERENCE",
          keyFact: `Onboarding completed for ${seniorName}. Doctor Pup is ready to assist daily.`,
        },
      ],
    };

    return NextResponse.json({
      success: true,
      fallback: true,
      seniorId: fallbackSeniorId,
      name: seniorName,
      senior: fallbackSenior,
    });
  }
}
