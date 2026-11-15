import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, age, caregiverEmail, pin, medications } = body;

    const seniorName = (name && String(name).trim()) || "Grandma Mary";
    const seniorAge = Number(age) || 75;
    const email = (caregiverEmail && String(caregiverEmail).trim()) || "caregiver@example.com";
    const passcode = (pin && String(pin).trim()) || "1234";

    // Find existing profile or create new
    let senior = await prisma.seniorProfile.findFirst();

    if (senior) {
      senior = await prisma.seniorProfile.update({
        where: { id: senior.id },
        data: {
          name: seniorName,
          age: seniorAge,
          caregiverEmail: email,
          passcodeHash: passcode,
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
          passcodeHash: passcode,
          streakDays: 1,
        },
      });
    }

    // Insert new medications
    const medList = Array.isArray(medications) && medications.length > 0
      ? medications
      : [
          {
            name: "Lisinopril",
            dosage: "10mg",
            timeOfDay: "Morning",
            instructions: "Take 1 tablet with water after breakfast.",
          },
        ];

    const today = new Date();
    today.setHours(9, 0, 0, 0);

    for (const med of medList) {
      if (!med.name || !med.name.trim()) continue;

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

      // Create a pending dose log for today
      await prisma.doseLog.create({
        data: {
          seniorId: senior.id,
          medicationId: createdMed.id,
          scheduledFor: today,
          status: "PENDING",
        },
      });
    }

    // Add welcoming memory note
    await prisma.adaptiveMemory.create({
      data: {
        seniorId: senior.id,
        category: "PERSONAL_PREFERENCE",
        keyFact: `Onboarding completed for ${seniorName}. Doctor Pup is ready to assist daily.`,
      },
    });

    return NextResponse.json({
      success: true,
      seniorId: senior.id,
      name: seniorName,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Failed to save onboarding setup" }, { status: 500 });
  }
}
