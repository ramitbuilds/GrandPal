import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { doctorName, specialty, date, location, notes, seniorId } = await req.json();

    if (!doctorName || !specialty || !date || !location) {
      return NextResponse.json(
        { error: "Doctor name, specialty, date, and location are required" },
        { status: 400 }
      );
    }

    let targetSeniorId = seniorId;
    if (!targetSeniorId) {
      const senior = await prisma.seniorProfile.findFirst({ select: { id: true } });
      if (!senior) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      targetSeniorId = senior.id;
    }

    const appointment = await prisma.appointment.create({
      data: {
        doctorName,
        specialty,
        date: new Date(date),
        location,
        notes: notes || "",
        seniorId: targetSeniorId,
      },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Appointment deleted" });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }
}
