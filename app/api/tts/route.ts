import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "en-US-AnaNeural" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // Clean text of quotes and special characters for shell execution
    const cleanText = text.replace(/["\\]/g, " ").trim();
    if (!cleanText) {
      return NextResponse.json({ error: "Empty text" }, { status: 400 });
    }

    const tempFileName = `pup_tts_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);
    const scriptPath = path.join(process.cwd(), "scripts", "tts_runner.py");

    // Execute python edge-tts runner
    const cmd = `python "${scriptPath}" "${tempFilePath}" "${cleanText}" "${voice}"`;
    await execAsync(cmd);

    // Read the generated audio file
    const audioBuffer = await fs.readFile(tempFilePath);

    // Clean up temporary file asynchronously
    fs.unlink(tempFilePath).catch(() => {});

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("TTS generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
