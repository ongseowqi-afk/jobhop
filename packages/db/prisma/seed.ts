import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.shiftAssignment.deleteMany(),
    prisma.timesheet.deleteMany(),
    prisma.application.deleteMany(),
    prisma.shift.deleteMany(),
    prisma.placement.deleteMany(),
    prisma.earning.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.jobSkillRequirement.deleteMany(),
    prisma.job.deleteMany(),
    prisma.workerSkill.deleteMany(),
    prisma.document.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.workerProfile.deleteMany(),
    prisma.recruiterProfile.deleteMany(),
    prisma.agencyProfile.deleteMany(),
    prisma.clientProfile.deleteMany(),
    prisma.client.deleteMany(),
    prisma.agency.deleteMany(),
    prisma.user.deleteMany(),
    prisma.skill.deleteMany(),
  ]);

  // Skills
  const skills = await Promise.all([
    prisma.skill.create({ data: { name: "Warehouse Ops" } }),
    prisma.skill.create({ data: { name: "Event Management" } }),
    prisma.skill.create({ data: { name: "Forklift" } }),
    prisma.skill.create({ data: { name: "Retail" } }),
    prisma.skill.create({ data: { name: "Food Handling" } }),
    prisma.skill.create({ data: { name: "Delivery" } }),
    prisma.skill.create({ data: { name: "Logistics" } }),
    prisma.skill.create({ data: { name: "F&B" } }),
  ]);
  const [warehouse, events, forklift, retail, foodHandling, delivery, logistics, fnb] = skills;

  // Agency
  const agency = await prisma.agency.create({ data: { name: "MCI Workforce Solutions" } });

  // Agency Admin — Sarah Chen
  await prisma.user.create({
    data: {
      name: "Sarah Chen",
      email: "sarah@mci.com.sg",
      role: "AGENCY",
      agencyProfile: { create: { agencyId: agency.id } },
    },
  });

  // Recruiter — Priya Sharma
  await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@mci.com.sg",
      role: "RECRUITER",
      recruiterProfile: { create: { agencyId: agency.id, totalCommission: 8420 } },
    },
  });

  // Clients
  const dbsMbs = await prisma.client.create({
    data: {
      name: "DBS Marina Bay Sands",
      industry: "Events & Hospitality",
      agencyId: agency.id,
      contactName: "Tan Wei Ming",
      contactEmail: "weiming@dbs.com.sg",
    },
  });
  const lazada = await prisma.client.create({
    data: {
      name: "Lazada Fulfillment",
      industry: "Logistics & Warehousing",
      agencyId: agency.id,
      contactName: "Ahmad Ibrahim",
      contactEmail: "ahmad@lazada.sg",
    },
  });
  const uniqlo = await prisma.client.create({
    data: {
      name: "Uniqlo Singapore",
      industry: "Retail",
      agencyId: agency.id,
      contactName: "Yuki Tanaka",
      contactEmail: "yuki@uniqlo.sg",
    },
  });
  const grabFood = await prisma.client.create({
    data: {
      name: "GrabFood Singapore",
      industry: "Delivery / Logistics",
      agencyId: agency.id,
      contactName: "Li Mei",
      contactEmail: "limei@grab.com",
    },
  });

  // Workers — all VERIFIED CITIZENS for demo
  const workerDefaults = {
    residencyStatus: "CITIZEN" as const,
    verificationStatus: "VERIFIED" as const,
    verifiedAt: new Date(),
    contractorAgreed: true,
    contractorAgreedAt: new Date(),
    isStudentPass: false,
  };

  const marcus = await prisma.user.create({
    data: {
      name: "Marcus Lim",
      phone: "+6591234567",
      email: "marcus.lim@gmail.com",
      role: "WORKER",
      workerProfile: {
        create: {
          ...workerDefaults,
          rating: 4.9,
          reviewCount: 38,
          showRate: 96,
          shiftsCount: 47,
          totalEarned: 2840,
          isAvailable: true,
          skills: {
            create: [
              { skillId: warehouse.id, verified: true },
              { skillId: events.id, verified: true },
              { skillId: forklift.id, verified: true },
              { skillId: retail.id },
              { skillId: foodHandling.id },
            ],
          },
        },
      },
    },
    include: { workerProfile: true },
  });

  const aisha = await prisma.user.create({
    data: {
      name: "Aisha Tan",
      phone: "+6592345678",
      role: "WORKER",
      workerProfile: {
        create: {
          ...workerDefaults,
          rating: 4.7,
          reviewCount: 18,
          showRate: 92,
          shiftsCount: 23,
          totalEarned: 1680,
          isAvailable: true,
          skills: {
            create: [
              { skillId: warehouse.id, verified: true },
              { skillId: logistics.id, verified: true },
            ],
          },
        },
      },
    },
    include: { workerProfile: true },
  });

  const rajesh = await prisma.user.create({
    data: {
      name: "Rajesh Kumar",
      phone: "+6593456789",
      role: "WORKER",
      workerProfile: {
        create: {
          ...workerDefaults,
          rating: 4.5,
          reviewCount: 28,
          showRate: 94,
          shiftsCount: 35,
          totalEarned: 2200,
          isAvailable: true,
          skills: {
            create: [
              { skillId: events.id, verified: true },
              { skillId: retail.id },
            ],
          },
        },
      },
    },
    include: { workerProfile: true },
  });

  const jenny = await prisma.user.create({
    data: {
      name: "Jenny Wong",
      phone: "+6594567890",
      role: "WORKER",
      workerProfile: {
        create: {
          ...workerDefaults,
          rating: 4.8,
          reviewCount: 45,
          showRate: 98,
          shiftsCount: 62,
          totalEarned: 4100,
          isAvailable: true,
          skills: {
            create: [
              { skillId: retail.id, verified: true },
              { skillId: fnb.id, verified: true },
              { skillId: events.id },
            ],
          },
        },
      },
    },
    include: { workerProfile: true },
  });

  const siti = await prisma.user.create({
    data: {
      name: "Siti Nurhayati",
      phone: "+6595678901",
      role: "WORKER",
      workerProfile: {
        create: {
          ...workerDefaults,
          rating: 4.8,
          reviewCount: 22,
          showRate: 100,
          shiftsCount: 31,
          totalEarned: 1950,
          isAvailable: true,
          skills: {
            create: [
              { skillId: retail.id, verified: true },
              { skillId: warehouse.id, verified: true },
            ],
          },
        },
      },
    },
    include: { workerProfile: true },
  });

  // Jobs + Shifts
  const today = new Date();
  const day = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Job 1 — Event Staff at MBS (filling, some shifts upcoming)
  const eventStaff = await prisma.job.create({
    data: {
      title: "Event Staff",
      clientId: dbsMbs.id,
      category: "Events",
      location: "Marina Bay Sands",
      latitude: 1.2834,
      longitude: 103.8607,
      payRate: 15,
      slotsTotal: 12,
      slotsFilled: 8,
      status: "FILLING",
      startDate: day(-3),
      shifts: {
        create: [
          { date: day(1), startTime: "09:00", endTime: "17:00", slotsTotal: 6, slotsFilled: 4 },
          { date: day(3), startTime: "10:00", endTime: "18:00", slotsTotal: 6, slotsFilled: 3 },
          { date: day(5), startTime: "09:00", endTime: "17:00", slotsTotal: 6, slotsFilled: 2 },
        ],
      },
    },
    include: { shifts: true },
  });

  // Job 2 — Event Crew at MBS (open)
  const eventCrew = await prisma.job.create({
    data: {
      title: "Event Crew",
      clientId: dbsMbs.id,
      category: "Events",
      location: "Marina Bay Sands, CBD",
      latitude: 1.2834,
      longitude: 103.8607,
      payRate: 15,
      slotsTotal: 12,
      slotsFilled: 3,
      status: "OPEN",
      startDate: day(6),
      endDate: day(7),
      shifts: {
        create: [
          { date: day(6), startTime: "08:00", endTime: "16:00", slotsTotal: 6, slotsFilled: 2 },
          { date: day(7), startTime: "08:00", endTime: "16:00", slotsTotal: 6, slotsFilled: 1 },
        ],
      },
    },
    include: { shifts: true },
  });

  // Job 3 — Warehouse Packer at Lazada (filling)
  const warehousePacker = await prisma.job.create({
    data: {
      title: "Warehouse Packer",
      clientId: lazada.id,
      category: "Logistics",
      location: "Tuas, Singapore",
      latitude: 1.3187,
      longitude: 103.6365,
      payRate: 12.5,
      slotsTotal: 20,
      slotsFilled: 18,
      status: "FILLING",
      startDate: day(2),
      shifts: {
        create: [
          { date: day(2), startTime: "07:00", endTime: "15:00", slotsTotal: 10, slotsFilled: 9 },
          { date: day(4), startTime: "07:00", endTime: "15:00", slotsTotal: 10, slotsFilled: 9 },
        ],
      },
    },
    include: { shifts: true },
  });

  // Job 4 — Retail Associate at Uniqlo (open, ongoing)
  const retailAssoc = await prisma.job.create({
    data: {
      title: "Retail Associate",
      clientId: uniqlo.id,
      category: "Retail",
      location: "Orchard Road",
      latitude: 1.3021,
      longitude: 103.8364,
      payRate: 13,
      slotsTotal: 8,
      slotsFilled: 5,
      status: "OPEN",
      startDate: day(-10),
      isOngoing: true,
      shifts: {
        create: [
          { date: day(1), startTime: "10:00", endTime: "18:00", slotsTotal: 4, slotsFilled: 3 },
          { date: day(3), startTime: "10:00", endTime: "18:00", slotsTotal: 4, slotsFilled: 2 },
          { date: day(8), startTime: "10:00", endTime: "18:00", slotsTotal: 4, slotsFilled: 0 },
        ],
      },
    },
    include: { shifts: true },
  });

  // Job 5 — Delivery Rider at GrabFood (open, ongoing)
  await prisma.job.create({
    data: {
      title: "Delivery Rider",
      clientId: grabFood.id,
      category: "Delivery",
      location: "Island-wide",
      payRate: 16,
      slotsTotal: 30,
      status: "OPEN",
      startDate: day(10),
      isOngoing: true,
      description: "Own vehicle required. Delivery bonuses available.",
      shifts: {
        create: [
          { date: day(10), startTime: "11:00", endTime: "21:00", slotsTotal: 15, slotsFilled: 0 },
          { date: day(11), startTime: "11:00", endTime: "21:00", slotsTotal: 15, slotsFilled: 0 },
        ],
      },
    },
  });

  // Marcus — 3 upcoming shift assignments
  const marcusProfileId = marcus.workerProfile!.id;
  await prisma.shiftAssignment.createMany({
    data: [
      { shiftId: eventStaff.shifts[0].id, workerId: marcusProfileId, status: "CONFIRMED" },
      { shiftId: eventStaff.shifts[1].id, workerId: marcusProfileId, status: "CONFIRMED" },
      { shiftId: warehousePacker.shifts[0].id, workerId: marcusProfileId, status: "CONFIRMED" },
    ],
  });

  // Other workers — some shift assignments for realism
  const aishaProfileId = aisha.workerProfile!.id;
  const rajeshProfileId = rajesh.workerProfile!.id;
  const jennyProfileId = jenny.workerProfile!.id;
  const sitiProfileId = siti.workerProfile!.id;

  await prisma.shiftAssignment.createMany({
    data: [
      { shiftId: eventStaff.shifts[0].id, workerId: rajeshProfileId, status: "CONFIRMED" },
      { shiftId: eventStaff.shifts[0].id, workerId: jennyProfileId, status: "CONFIRMED" },
      { shiftId: warehousePacker.shifts[0].id, workerId: aishaProfileId, status: "CONFIRMED" },
      { shiftId: warehousePacker.shifts[1].id, workerId: aishaProfileId, status: "CONFIRMED" },
      { shiftId: retailAssoc.shifts[0].id, workerId: jennyProfileId, status: "CONFIRMED" },
      { shiftId: retailAssoc.shifts[0].id, workerId: sitiProfileId, status: "CONFIRMED" },
      { shiftId: retailAssoc.shifts[1].id, workerId: sitiProfileId, status: "CONFIRMED" },
      { shiftId: eventCrew.shifts[0].id, workerId: rajeshProfileId, status: "CONFIRMED" },
    ],
  });

  // Marcus — accepted applications for his assigned jobs
  await prisma.application.createMany({
    data: [
      { workerId: marcusProfileId, jobId: eventStaff.id, status: "ACCEPTED", appliedAt: day(-5) },
      { workerId: marcusProfileId, jobId: warehousePacker.id, status: "ACCEPTED", appliedAt: day(-4) },
    ],
  });

  // Marcus — past earnings to total $2,840
  await prisma.earning.createMany({
    data: [
      { workerId: marcusProfileId, periodStart: day(-28), periodEnd: day(-22), grossAmount: 720, bonus: 0, netAmount: 720, status: "PAID", paidAt: day(-20) },
      { workerId: marcusProfileId, periodStart: day(-21), periodEnd: day(-15), grossAmount: 680, bonus: 50, netAmount: 730, status: "PAID", paidAt: day(-13) },
      { workerId: marcusProfileId, periodStart: day(-14), periodEnd: day(-8), grossAmount: 750, bonus: 0, netAmount: 750, status: "PAID", paidAt: day(-6) },
      { workerId: marcusProfileId, periodStart: day(-7), periodEnd: day(-1), grossAmount: 600, bonus: 40, netAmount: 640, status: "PROCESSING" },
    ],
  });

  console.log("Seed complete:");
  console.log("  1 Agency: MCI Workforce Solutions");
  console.log("  1 Recruiter: Priya Sharma (priya@mci.com.sg)");
  console.log("  1 Agency Admin: Sarah Chen (sarah@mci.com.sg)");
  console.log("  4 Clients: DBS MBS, Lazada, Uniqlo, GrabFood");
  console.log("  5 Workers (all VERIFIED CITIZEN)");
  console.log("  5 Jobs with shifts");
  console.log("  Marcus: 3 upcoming shifts, $2,840 total earned");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
