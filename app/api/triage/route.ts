import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { symptom, seniorId } = await req.json();

    if (!symptom || typeof symptom !== "string") {
      return NextResponse.json({ error: "Symptom description is required" }, { status: 400 });
    }

    // Load senior profile with medications and past memories
    let targetSeniorId = seniorId;
    let senior = null;

    if (targetSeniorId) {
      senior = await prisma.seniorProfile.findUnique({
        where: { id: targetSeniorId },
        include: {
          medications: { where: { active: true } },
          memories: { take: 5, orderBy: { createdAt: "desc" } },
        },
      });
    }

    if (!senior) {
      senior = await prisma.seniorProfile.findFirst({
        include: {
          medications: { where: { active: true } },
          memories: { take: 5, orderBy: { createdAt: "desc" } },
        },
      });
    }

    if (!senior) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const medNames = senior.medications.map((m) => `${m.name} ${m.dosage}`).join(", ");
    const memoriesText = senior.memories.map((m) => m.keyFact).join("; ");

    let advice = "";
    let severityScore = 3;
    let clinicalSummary = "";
    let extractedFact = "";

    // Check if Google Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        const systemPrompt = `You are Doctor Pup, a gentle, kind medical assistant for an elderly senior named ${senior.name} (age ${senior.age}).
Active medications: ${medNames || "None"}.
Past health notes: ${memoriesText || "None"}.

The senior reported this symptom: "${symptom}".

Analyze the symptom.
Return a STRICT JSON object with these 4 keys:
1. "advice": 2-3 warm, simple sentences of plain advice for the senior. No medical jargon. No em dashes. Very reassuring.
2. "severityScore": an integer from 1 to 10 (1 is minor like mild dry mouth, 10 is immediate emergency like severe chest pain).
3. "clinicalSummary": 1 sentence summarizing the symptom and potential medication interaction for the caregiver.
4. "extractedFact": a short 1-sentence note to remember (e.g. "Reported mild dizziness after breakfast") or empty string.`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: systemPrompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        advice = parsed.advice || "Please take a moment to sit down, sip some water, and rest quietly.";
        severityScore = Number(parsed.severityScore) || 3;
        clinicalSummary = parsed.clinicalSummary || "Senior reported mild symptoms. Resting comfortably.";
        extractedFact = parsed.extractedFact || "";
      } catch (geminiError) {
        console.error("Gemini API call failed, using clinical fallback:", geminiError);
      }
    }

    // Clinical Fallback if Gemini key is not set or call failed
    if (!advice) {
      const lower = symptom.toLowerCase();

      if (lower.includes("chest") || lower.includes("breathe") || lower.includes("shortness") || lower.includes("faint")) {
        severityScore = 8;
        advice = "Please sit down right away and take slow, calm breaths. We are alerting your caregiver to check on you.";
        clinicalSummary = `Urgent: Senior reported potential cardiorespiratory symptom: "${symptom}". Caregiver alert triggered.`;
        extractedFact = `Reported breathing or chest discomfort on ${new Date().toLocaleDateString()}`;
      } else if (lower.includes("dizzy") || lower.includes("lightheaded") || lower.includes("headache")) {
        severityScore = 4;
        advice = "Please sit in a comfortable chair and drink a full glass of water. Getting up slowly will help your balance.";
        clinicalSummary = `Senior reported dizziness. Could correlate with Lisinopril blood pressure adjustment.`;
        extractedFact = `Experienced mild dizziness or lightheadedness on ${new Date().toLocaleDateString()}`;
      } else if (lower.includes("stomach") || lower.includes("nausea") || lower.includes("belly")) {
        severityScore = 3;
        advice = "Try sipping some warm water or tea, and rest your stomach. Taking medicine with a small meal often helps.";
        clinicalSummary = `Mild stomach sensitivity noted. Metformin is best taken with meals to prevent mild upset.`;
        extractedFact = `Noted mild stomach sensitivity after lunch on ${new Date().toLocaleDateString()}`;
      } else if (lower.includes("knee") || lower.includes("joint") || lower.includes("stiff") || lower.includes("pain")) {
        severityScore = 3;
        advice = "Gentle warmth and resting your knee can help with stiffness. Please keep off feet until you feel steady.";
        clinicalSummary = `Joint stiffness reported, consistent with known knee sensitivity.`;
        extractedFact = `Reported knee stiffness on ${new Date().toLocaleDateString()}`;
      } else {
        severityScore = 2;
        advice = "Thank you for letting me know. Please rest comfortably in your favorite chair and have a warm drink.";
        clinicalSummary = `Routine health update logged: "${symptom}".`;
        extractedFact = `Shared feeling: "${symptom}"`;
      }
    }

    // Clean any accidental em dashes from advice
    advice = advice.replace(/—/g, ": ").replace(/--/g, "-");

    // Save Triage Record in database
    const triageRecord = await prisma.triageRecord.create({
      data: {
        seniorId: senior.id,
        reportedText: symptom,
        severityScore,
        guidance: advice,
        status: severityScore >= 7 ? "ESCALATED" : "RESOLVED",
      },
    });

    // Save extracted memory fact if present
    if (extractedFact) {
      await prisma.adaptiveMemory.create({
        data: {
          seniorId: senior.id,
          category: "SYMPTOM",
          keyFact: extractedFact,
          confidence: 1.0,
        },
      });
    }

    // If severity is 7 or higher, dispatch urgent caregiver alert email
    let alertSent = false;
    if (severityScore >= 7 && senior.caregiverEmail) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        await transporter.sendMail({
          from: '"GrandPal Triage" <triage@grandpal.care>',
          to: senior.caregiverEmail,
          subject: `Urgent Caregiver Notice: Health Alert for ${senior.name}`,
          text: `Hello Sarah,\n\nGrandPal Doctor Pup triage recorded a higher severity symptom for ${senior.name}.\n\nReported: "${symptom}"\nSeverity Score: ${severityScore}/10\nClinical Note: ${clinicalSummary}\nAdvice Given: ${advice}\n\nPlease check in with them promptly.\n\nWarm regards,\nGrandPal Clinical Care Team`,
        });
        alertSent = true;
      } catch (emailErr) {
        console.error("Failed to send urgent triage email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      advice,
      severityScore,
      clinicalSummary,
      extractedFact,
      triageId: triageRecord.id,
      escalated: severityScore >= 7,
      alertSent,
    });
  } catch (error) {
    console.error("Triage error:", error);
    return NextResponse.json({ error: "Failed to evaluate symptoms" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const records = await prisma.triageRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error("Failed to fetch triage records:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
