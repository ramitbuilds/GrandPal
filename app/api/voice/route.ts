import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { speech, seniorId } = await req.json();

    if (!speech || !seniorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const senior = await prisma.seniorProfile.findUnique({
      where: { id: seniorId },
      include: {
        medications: { where: { active: true } },
        doseLogs: {
          orderBy: { scheduledFor: "desc" },
          take: 10,
        },
        memories: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!senior) {
      return NextResponse.json({ error: "Senior not found" }, { status: 404 });
    }

    const lower = speech.toLowerCase();

    // Check if confirming a medication dose
    if (
      lower.includes("took") ||
      lower.includes("taken") ||
      lower.includes("done") ||
      lower.includes("swallowed") ||
      lower.includes("finished") ||
      lower.includes("yes")
    ) {
      // Find today's pending dose
      const pendingMed = senior.medications.find(
        (m) => !senior.doseLogs.some((l) => l.medicationId === m.id && l.status === "TAKEN")
      );

      if (pendingMed) {
        await prisma.doseLog.create({
          data: {
            seniorId: senior.id,
            medicationId: pendingMed.id,
            scheduledFor: new Date(),
            takenAt: new Date(),
            status: "TAKEN",
            notes: `Confirmed via voice: "${speech}"`,
          },
        });

        const updatedSenior = await prisma.seniorProfile.update({
          where: { id: senior.id },
          data: { streakDays: { increment: 1 } },
        });

        return NextResponse.json({
          response: `Good job, ${senior.name}. I recorded your ${pendingMed.name}. Your adherence streak is now ${updatedSenior.streakDays} days.`,
          action: "DOSE_LOGGED",
          streakDays: updatedSenior.streakDays,
        });
      } else {
        return NextResponse.json({
          response: `All your scheduled medications for today have already been recorded, ${senior.name}.`,
          action: "NONE",
        });
      }
    }

    // Check status or schedule question
    if (lower.includes("what") || lower.includes("when") || lower.includes("schedule") || lower.includes("medicine")) {
      const nextMed = senior.medications.find(
        (m) => !senior.doseLogs.some((l) => l.medicationId === m.id && l.status === "TAKEN")
      );

      if (nextMed) {
        return NextResponse.json({
          response: `Your next medication is ${nextMed.name} ${nextMed.dosage}, scheduled for ${nextMed.timeOfDay}. Instructions: ${nextMed.instructions}.`,
          action: "INFO",
        });
      } else {
        return NextResponse.json({
          response: `You have completed all scheduled medications for today, ${senior.name}.`,
          action: "INFO",
        });
      }
    }

    // General greeting or fallback
    return NextResponse.json({
      response: `I heard you say: "${speech}". You can say "I took my medicine" to log your dose, or ask "What is my next medicine".`,
      action: "ACK",
    });
  } catch (error) {
    console.error("Voice processing error:", error);
    return NextResponse.json({ error: "Failed to process voice" }, { status: 500 });
  }
}
