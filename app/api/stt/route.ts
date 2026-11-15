import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 1. Primary STT: Google Gemini 1.5 Flash Multimodal Audio Transcription
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: audioFile.type || "audio/webm",
                    data: base64Audio,
                  },
                },
                {
                  text: "You are a medical speech-to-text transcriber for an elderly person. Transcribe their spoken words in English accurately. Do not add quotes, commentary, or markdown. Only return the exact spoken words. If no speech is audible, return nothing.",
                },
              ],
            },
          ],
        });

        const transcript = response.text?.trim() || "";
        return NextResponse.json({ transcript, provider: "gemini" });
      } catch (geminiErr) {
        console.warn("Gemini audio STT failed, falling back to local runner:", geminiErr);
      }
    }

    // 2. Fallback STT: Python SpeechRecognition runner
    try {
      const tempIn = path.join(os.tmpdir(), `pup_in_${Date.now()}.wav`);
      await fs.writeFile(tempIn, buffer);

      const scriptPath = path.join(process.cwd(), "scripts", "stt_runner.py");
      const { stdout } = await execAsync(`python "${scriptPath}" "${tempIn}"`);
      await fs.unlink(tempIn).catch(() => {});

      const transcript = stdout.trim();
      return NextResponse.json({ transcript, provider: "python" });
    } catch (fallbackErr) {
      console.warn("Local STT runner error:", fallbackErr);
    }

    return NextResponse.json({ transcript: "" }, { status: 200 });
  } catch (error) {
    console.error("STT route error:", error);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
