import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { medicationId, seniorId, note, status } = await req.json();

    if (!medicationId || !seniorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const logStatus = status === "TAKEN_EARLY" ? "TAKEN_EARLY" : "TAKEN";

    const log = await prisma.doseLog.create({
      data: {
        seniorId,
        medicationId,
        scheduledFor: new Date(),
        takenAt: new Date(),
        status: logStatus,
        notes: note ?? "Confirmed on Senior Portal",
      },
    });

    if (logStatus === "TAKEN_EARLY") {
      await prisma.adaptiveMemory.create({
        data: {
          seniorId,
          category: "HEALTH_OBSERVATION",
          keyFact: `Early Dose Notification: ${note ?? "Took medicine before scheduled time"}`,
        },
      });
    }

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
