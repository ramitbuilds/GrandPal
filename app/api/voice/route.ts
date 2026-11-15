import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

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

    const lower = speech.toLowerCase();

    // 1. DOSE CONFIRMATION
    if (
      lower.includes("took") ||
      lower.includes("taken") ||
      lower.includes("swallowed") ||
      lower.includes("done") ||
      lower.includes("finished my pill") ||
      lower.includes("finished my medicine") ||
      lower.includes("already had my")
    ) {
      // Find today's pending medication
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
            notes: `Confirmed via Doctor Pup conversation: "${speech}"`,
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
      } else {
        return NextResponse.json({
          response: `All your scheduled medicines for today are already recorded, ${senior.name}. You are doing wonderful!`,
          action: "NONE",
        });
      }
    }

    // 2. SCHEDULE QUERY
    if (
      lower.includes("what") ||
      lower.includes("when") ||
      lower.includes("schedule") ||
      lower.includes("which pill") ||
      lower.includes("next medicine")
    ) {
      const nextMed = senior.medications.find(
        (m) => !senior.doseLogs.some((l) => l.medicationId === m.id && l.status === "TAKEN")
      );

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

    // 3. HEALTH SYMPTOM / GENERAL CONVERSATION VIA GEMINI AI
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const medsSummary = senior.medications.map((m) => `${m.name} (${m.dosage})`).join(", ");
        const memoriesSummary = senior.memories.map((m) => m.keyFact).join("; ");

        const systemPrompt = `You are Doctor Pup, an affectionate, attentive dog mascot and health companion for an elderly person named ${senior.name}.
Active medications: ${medsSummary}.
Recent health observations: ${memoriesSummary}.

Guidelines:
1. Speak warmly, respectfully, and gently as their loving companion.
2. Keep responses very short (1 to 2 sentences maximum) so it feels like natural spoken dialogue.
3. If they mention feeling pain, dizzy, stiff, or unwell, offer gentle, reassuring advice and tell them you will let their caregiver know.
4. Do NOT use medical jargon, complex words, emojis, or em dashes. Keep language simple, comforting, and clear.`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\nSenior said: "${speech}"` }] },
          ],
        });

        const reply = response.text?.trim() || `I am right here with you, ${senior.name}. You are doing great today.`;

        // Check if symptom was described
        if (
          lower.includes("hurt") ||
          lower.includes("pain") ||
          lower.includes("dizzy") ||
          lower.includes("sick") ||
          lower.includes("tired") ||
          lower.includes("ache")
        ) {
          await prisma.adaptiveMemory.create({
            data: {
              seniorId: senior.id,
              category: "HEALTH_OBSERVATION",
              keyFact: `Reported during voice conversation: "${speech}"`,
            },
          });
        }

        return NextResponse.json({
          response: reply,
          action: "CONVERSATION",
        });
      } catch (geminiError) {
        console.error("Gemini voice conversation fallback:", geminiError);
      }
    }

    // Fallback if AI key unavailable
    if (
      lower.includes("hurt") ||
      lower.includes("pain") ||
      lower.includes("dizzy") ||
      lower.includes("headache") ||
      lower.includes("stomach")
    ) {
      await prisma.adaptiveMemory.create({
        data: {
          seniorId: senior.id,
          category: "HEALTH_OBSERVATION",
          keyFact: `Reported discomfort via voice: "${speech}"`,
        },
      });

      return NextResponse.json({
        response: `I understand, ${senior.name}. Please sit down, sip some water, and rest. I have noted this down for your caregiver.`,
        action: "SYMPTOM",
      });
    }

    return NextResponse.json({
      response: `I heard you, ${senior.name}. I am always here by your side. Let me know if you need any help with your medicines today.`,
      action: "CONVERSATION",
    });
  } catch (error) {
    console.error("Voice processing error:", error);
    return NextResponse.json({ error: "Failed to process voice" }, { status: 500 });
  }
}
