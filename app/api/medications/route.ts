import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, dosage, timeOfDay, instructions, seniorId } = await req.json();

    if (!name || !dosage || !timeOfDay) {
      return NextResponse.json(
        { error: "Name, dosage, and time of day are required" },
        { status: 400 }
      );
    }

    // Default to the first senior if not passed
    let targetSeniorId = seniorId;
    if (!targetSeniorId) {
      const senior = await prisma.seniorProfile.findFirst({ select: { id: true } });
      if (!senior) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      targetSeniorId = senior.id;
    }

    const medication = await prisma.medication.create({
      data: {
        name,
        dosage,
        timeOfDay,
        instructions: instructions || "Take with water",
        seniorId: targetSeniorId,
        active: true,
      },
    });

    return NextResponse.json({ success: true, medication });
  } catch (error) {
    console.error("Create medication error:", error);
    return NextResponse.json({ error: "Failed to create medication" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Medication ID is required" }, { status: 400 });
    }

    await prisma.medication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Medication deleted" });
  } catch (error) {
    console.error("Delete medication error:", error);
    return NextResponse.json({ error: "Failed to delete medication" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, active, name, dosage, timeOfDay, instructions } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Medication ID is required" }, { status: 400 });
    }

    const updated = await prisma.medication.update({
      where: { id },
      data: {
        ...(typeof active === "boolean" && { active }),
        ...(name && { name }),
        ...(dosage && { dosage }),
        ...(timeOfDay && { timeOfDay }),
        ...(instructions && { instructions }),
      },
    });

    return NextResponse.json({ success: true, medication: updated });
  } catch (error) {
    console.error("Update medication error:", error);
    return NextResponse.json({ error: "Failed to update medication" }, { status: 500 });
  }
}
