import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.doseLog.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.adaptiveMemory.deleteMany();
  await prisma.triageRecord.deleteMany();
  await prisma.seniorProfile.deleteMany();

  const senior = await prisma.seniorProfile.create({
    data: {
      name: "Grandma Mary",
      age: 76,
      passcodeHash: "1234",
      caregiverEmail: "sarah.caregiver@example.com",
      streakDays: 4,
    },
  });

  const meds = await Promise.all([
    prisma.medication.create({
      data: {
        seniorId: senior.id,
        name: "Lisinopril",
        dosage: "10mg",
        timeOfDay: "08:00 AM",
        instructions: "Take with a full glass of water after breakfast",
        color: "bg-amber-100 text-amber-900 border-amber-300",
        shape: "circle",
      },
    }),
    prisma.medication.create({
      data: {
        seniorId: senior.id,
        name: "Metformin",
        dosage: "500mg",
        timeOfDay: "01:00 PM",
        instructions: "Take with lunchtime meal",
        color: "bg-blue-100 text-blue-900 border-blue-300",
        shape: "oval",
      },
    }),
    prisma.medication.create({
      data: {
        seniorId: senior.id,
        name: "Calcium & Vitamin D3",
        dosage: "600mg",
        timeOfDay: "08:00 PM",
        instructions: "Take after dinner before evening tea",
        color: "bg-emerald-100 text-emerald-900 border-emerald-300",
        shape: "capsule",
      },
    }),
  ]);

  const today = new Date();
  const morningDate = new Date(today);
  morningDate.setHours(8, 0, 0, 0);

  const afternoonDate = new Date(today);
  afternoonDate.setHours(13, 0, 0, 0);

  const eveningDate = new Date(today);
  eveningDate.setHours(20, 0, 0, 0);

  await prisma.doseLog.create({
    data: {
      seniorId: senior.id,
      medicationId: meds[0].id,
      scheduledFor: morningDate,
      takenAt: new Date(morningDate.getTime() + 15 * 60000),
      status: "TAKEN",
      notes: "Confirmed via voice: 'Took with warm oatmeal'",
    },
  });

  await prisma.doseLog.create({
    data: {
      seniorId: senior.id,
      medicationId: meds[1].id,
      scheduledFor: afternoonDate,
      status: "PENDING",
    },
  });

  await prisma.doseLog.create({
    data: {
      seniorId: senior.id,
      medicationId: meds[2].id,
      scheduledFor: eveningDate,
      status: "PENDING",
    },
  });

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 4);
  nextWeek.setHours(10, 30, 0, 0);

  await prisma.appointment.create({
    data: {
      seniorId: senior.id,
      doctorName: "Dr. Evelyn Vance",
      specialty: "Cardiology & Vascular Health",
      date: nextWeek,
      location: "St. Jude Medical Center, Suite 402",
      notes: "Routine 6-month blood pressure review and lab work review.",
    },
  });

  await prisma.adaptiveMemory.createMany({
    data: [
      {
        seniorId: senior.id,
        category: "FAMILY",
        keyFact: "Daughter is Sarah (primary caretaker); 9-year-old grandson is Leo who loves building LEGO with her.",
      },
      {
        seniorId: senior.id,
        category: "HABIT",
        keyFact: "Always drinks warm chamomile tea at 8:30 PM before bed.",
      },
      {
        seniorId: senior.id,
        category: "SYMPTOM",
        keyFact: "Experiences mild right knee stiffness on cold or rainy mornings.",
      },
    ],
  });

  await prisma.triageRecord.create({
    data: {
      seniorId: senior.id,
      reportedText: "My right knee felt a little stiff getting out of bed.",
      severityScore: 3,
      guidance: "Gentle warm compress recommended. Elevate leg and rest 15 minutes before walking.",
      status: "RESOLVED",
    },
  });

  console.log("Database seeded successfully with Grandma Mary profile.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
