import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const senior = await prisma.seniorProfile.findFirst({
      include: {
        medications: {
          where: { active: true },
        },
        doseLogs: {
          orderBy: { scheduledFor: "desc" },
          take: 20,
        },
        appointments: {
          orderBy: { date: "asc" },
        },
        memories: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (senior) {
      return NextResponse.json(senior);
    }
  } catch (error) {
    console.error("Prisma error in /api/senior (providing resilient fallback):", error);
  }

  // Resilient fallback profile if database has not yet been initialized or is in cold boot
  const defaultProfile = {
    id: "default-senior-profile",
    name: "Grandma Mary",
    age: 76,
    caregiverEmail: "caregiver@example.com",
    streakDays: 4,
    medications: [
      {
        id: "default-med-1",
        seniorId: "default-senior-profile",
        name: "Lisinopril",
        dosage: "10mg",
        timeOfDay: "Morning",
        instructions: "Take 1 tablet with a full glass of water after breakfast.",
        color: "bg-amber-100 text-amber-900 border-amber-300",
        shape: "pill",
        active: true,
      },
      {
        id: "default-med-2",
        seniorId: "default-senior-profile",
        name: "Metformin",
        dosage: "500mg",
        timeOfDay: "Afternoon",
        instructions: "Take 1 tablet with lunch to maintain stable glucose.",
        color: "bg-blue-100 text-blue-900 border-blue-300",
        shape: "round",
        active: true,
      },
      {
        id: "default-med-3",
        seniorId: "default-senior-profile",
        name: "Atorvastatin",
        dosage: "20mg",
        timeOfDay: "Night",
        instructions: "Take 1 tablet before bedtime.",
        color: "bg-purple-100 text-purple-900 border-purple-300",
        shape: "capsule",
        active: true,
      },
    ],
    doseLogs: [
      {
        id: "default-dose-1",
        seniorId: "default-senior-profile",
        medicationId: "default-med-1",
        scheduledFor: new Date().toISOString(),
        status: "PENDING",
      },
    ],
    appointments: [
      {
        id: "default-apt-1",
        title: "Annual Cardiology Wellness Check",
        doctor: "Dr. Sarah Chen, MD",
        date: new Date(Date.now() + 86400000 * 3).toISOString(),
        location: "Metro Community Health Center, Suite 402",
      },
    ],
    memories: [
      {
        id: "default-mem-1",
        category: "PERSONAL_PREFERENCE",
        keyFact: "Prefers water at room temperature when taking morning tablets.",
      },
    ],
  };

  return NextResponse.json(defaultProfile);
}
