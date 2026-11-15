import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    const senior = await prisma.seniorProfile.findFirst({
      select: { id: true, passcodeHash: true, name: true },
    });

    if (!senior) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isValid = senior.passcodeHash === String(pin).trim();

    if (!isValid) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      seniorId: senior.id,
      seniorName: senior.name,
    });
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
