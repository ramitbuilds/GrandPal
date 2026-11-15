import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const senior = await prisma.seniorProfile.findFirst({
      include: {
        medications: {
          where: { active: true },
        },
        doseLogs: {
          orderBy: { scheduledFor: "desc" },
          take: 20,
        },
        appointments: {
          orderBy: { date: "asc" },
        },
        memories: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!senior) {
      return NextResponse.json({ error: "Senior profile not found" }, { status: 404 });
    }

    return NextResponse.json(senior);
  } catch (error) {
    console.error("Failed to fetch senior profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
