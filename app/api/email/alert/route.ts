import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { type, customNote } = await req.json();

    const senior = await prisma.seniorProfile.findFirst({
      include: {
        medications: { where: { active: true } },
        doseLogs: { take: 5, orderBy: { scheduledFor: "desc" } },
      },
    });

    if (!senior) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const recipient = senior.caregiverEmail || "caregiver@example.com";
    let subject = "GrandPal Care Update";
    let text = "";

    if (type === "MISSED_DOSE") {
      subject = `Urgent: Missed Medicine Reminder for ${senior.name}`;
      text = `Hello Sarah,\n\nThis is an alert from GrandPal. ${senior.name} has not confirmed their scheduled medicine within the expected timeframe.\n\nPlease check in with them to ensure they have taken their required dosage.\n\nTime of Alert: ${new Date().toLocaleTimeString()}\n${customNote ? `Note: ${customNote}\n` : ""}\nWarm regards,\nGrandPal Care Team`;
    } else {
      const takenCount = senior.doseLogs.filter((l) => l.status === "TAKEN").length;
      subject = `Daily Medicine Summary for ${senior.name}`;
      text = `Hello Sarah,\n\nHere is the daily health summary for ${senior.name}:\n- Total Active Medicines: ${senior.medications.length}\n- Logged Doses: ${takenCount}\n\nEverything is currently being tracked. Have a peaceful day!\n\nWarm regards,\nGrandPal Care Team`;
    }

    // Configure transporter (falls back to console log preview if no external SMTP is set)
    let previewUrl: string | null = null;
    let sent = false;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: '"GrandPal Care" <notifications@grandpal.care>',
        to: recipient,
        subject,
        text,
      });
      if (process.env.NODE_ENV === "development") {
        console.log("Email alert dispatched with ID:", info.messageId);
      }
      sent = true;
    } else {
      // Offline / Hackathon Demo test transport
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

        const info = await transporter.sendMail({
          from: '"GrandPal Care" <notifications@grandpal.care>',
          to: recipient,
          subject,
          text,
        });

        previewUrl = nodemailer.getTestMessageUrl(info) || null;
        sent = true;
      } catch {
        // Fallback to console simulation
        console.log(`[EMAIL SIMULATION] To: ${recipient} | Subject: ${subject}`);
        console.log(text);
        sent = true;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      recipient,
      subject,
      text,
      previewUrl,
    });
  } catch (error) {
    console.error("Email dispatch error:", error);
    return NextResponse.json({ error: "Failed to send email alert" }, { status: 500 });
  }
}
