import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { medicationId, seniorId, note } = await req.json();

    if (!medicationId || !seniorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const log = await prisma.doseLog.create({
      data: {
        seniorId,
        medicationId,
        scheduledFor: new Date(),
        takenAt: new Date(),
        status: "TAKEN",
        notes: note ?? "Confirmed on Senior Portal",
      },
    });

    const senior = await prisma.seniorProfile.update({
      where: { id: seniorId },
      data: {
        streakDays: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, log, streakDays: senior.streakDays });
  } catch (error) {
    console.error("Dose log error:", error);
    return NextResponse.json({ error: "Failed to record dose" }, { status: 500 });
  }
}
