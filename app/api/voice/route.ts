import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGeminiClient, generateWithFallback } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { speech, seniorId } = await req.json();

    if (!speech || typeof speech !== "string") {
      return NextResponse.json({ error: "Missing speech input" }, { status: 400 });
    }

    // Load senior profile
    let senior = null;
    if (seniorId) {
      senior = await prisma.seniorProfile.findUnique({
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
    }

    if (!senior) {
      senior = await prisma.seniorProfile.findFirst({
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
    }

    if (!senior) {
      return NextResponse.json({ error: "Senior profile not found" }, { status: 404 });
    }

    const medsSummary = senior.medications
      .map((m) => `${m.name} (${m.dosage}, ${m.timeOfDay}) - ${m.instructions}`)
      .join("; ");
    const pendingMeds = senior.medications.filter(
      (m) => !senior.doseLogs.some((l) => l.medicationId === m.id && l.status === "TAKEN")
    );
    const pendingSummary = pendingMeds.map((m) => m.name).join(", ") || "None (all taken today)";
    const memoriesSummary = senior.memories.map((m) => m.keyFact).join("; ");

    const gemini = getGeminiClient();

    // 1. PRIMARY AI CONVERSATION ENGINE (Gemini)
    if (gemini) {
      try {
        const systemPrompt = `You are Doctor Pup, a loving, attentive golden puppy mascot and medical companion for an elderly person named ${senior.name} (age ${senior.age}).
Active medications: ${medsSummary || "None"}.
Pending medicines today: ${pendingSummary}.
Past health notes: ${memoriesSummary || "None"}.

Senior just said: "${speech}".

Analyze what the senior said and output a STRICT JSON object with these keys:
{
  "reply": "1 to 2 warm, gentle sentences responding directly to what the senior said. Speak like an affectionate companion dog. Never use emojis or em dashes.",
  "action": "DOSE_LOGGED" if the senior explicitly states they took/swallowed/finished their medicine, "SYMPTOM" if they report pain, dizziness, or sickness, or "CONVERSATION" for any question, chat, greeting, or comment,
  "medicationTaken": "name of medicine taken if DOSE_LOGGED, or null",
  "symptomNote": "short note of symptom if SYMPTOM, or null"
}`;

        const response = await generateWithFallback(gemini.ai, {
          contents: systemPrompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        const reply = parsed.reply || `I hear you, ${senior.name}. I am always right here by your side!`;
        const action = parsed.action || "CONVERSATION";

        // Handle medication dose logging if confirmed by AI
        if (action === "DOSE_LOGGED" || parsed.medicationTaken) {
          const targetMed =
            senior.medications.find(
              (m) =>
                m.name.toLowerCase().includes(String(parsed.medicationTaken || "").toLowerCase()) ||
                (parsed.medicationTaken && String(parsed.medicationTaken).toLowerCase().includes(m.name.toLowerCase()))
            ) || pendingMeds[0] || senior.medications[0];

          if (targetMed) {
            await prisma.doseLog.create({
              data: {
                seniorId: senior.id,
                medicationId: targetMed.id,
                scheduledFor: new Date(),
                takenAt: new Date(),
                status: "TAKEN",
                notes: `Confirmed via Doctor Pup conversation: "${speech}"`,
              },
            });

            const updatedSenior = await prisma.seniorProfile.update({
              where: { id: senior.id },
              data: { streakDays: { increment: 1 } },
            });

            return NextResponse.json({
              response: reply,
              action: "DOSE_LOGGED",
              medName: targetMed.name,
              streakDays: updatedSenior.streakDays,
            });
          }
        }

        // Record health symptom if reported
        if (action === "SYMPTOM" || parsed.symptomNote) {
          await prisma.adaptiveMemory.create({
            data: {
              seniorId: senior.id,
              category: "HEALTH_OBSERVATION",
              keyFact: parsed.symptomNote || `Reported during conversation: "${speech}"`,
            },
          });
        }

        return NextResponse.json({
          response: reply,
          action,
        });
      } catch (geminiError) {
        console.error("Gemini voice conversation error:", geminiError);
      }
    }

    // 2. FALLBACK IF GEMINI IS NOT CONFIGURED
    const lower = speech.toLowerCase();

    // Check for explicit dose confirmation
    if (
      (lower.includes("took") || lower.includes("taken") || lower.includes("swallowed") || lower.includes("had my")) &&
      (lower.includes("pill") || lower.includes("medicine") || lower.includes("dose") || lower.includes("tablet"))
    ) {
      const pendingMed = pendingMeds[0];
      if (pendingMed) {
        await prisma.doseLog.create({
          data: {
            seniorId: senior.id,
            medicationId: pendingMed.id,
            scheduledFor: new Date(),
            takenAt: new Date(),
            status: "TAKEN",
            notes: `Confirmed via fallback conversation: "${speech}"`,
          },
        });

        const updatedSenior = await prisma.seniorProfile.update({
          where: { id: senior.id },
          data: { streakDays: { increment: 1 } },
        });

        return NextResponse.json({
          response: `Good job, ${senior.name}! I recorded your ${pendingMed.name}. Your adherence streak is now ${updatedSenior.streakDays} days.`,
          action: "DOSE_LOGGED",
          medName: pendingMed.name,
          streakDays: updatedSenior.streakDays,
        });
      }
    }

    if (lower.includes("next medicine") || lower.includes("what pill") || lower.includes("medicine schedule")) {
      const nextMed = pendingMeds[0];
      if (nextMed) {
        return NextResponse.json({
          response: `Your next medicine is ${nextMed.name} ${nextMed.dosage}, scheduled for ${nextMed.timeOfDay}. Instructions: ${nextMed.instructions}.`,
          action: "INFO",
        });
      } else {
        return NextResponse.json({
          response: `You have completed all scheduled medicines for today, ${senior.name}. You can relax and enjoy your day!`,
          action: "INFO",
        });
      }
    }

    return NextResponse.json({
      response: `I hear you, ${senior.name}. You are doing wonderful today and I am right here by your side.`,
      action: "CONVERSATION",
    });
  } catch (error) {
    console.error("Voice processing error:", error);
    return NextResponse.json({ error: "Failed to process voice" }, { status: 500 });
  }
}
