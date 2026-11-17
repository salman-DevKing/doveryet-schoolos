/**
 * Seed script — creates one Doveryet super admin + one sample school
 * (Riverside Secondary) with realistic data for immediate development.
 *
 *   npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Doveryet SchoolOS…");

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ---------- Doveryet Super Admin ----------
  const salmanPw = await hash("doveryet-admin");
  const salman = await db.user.upsert({
    where: { email: "salman@doveryet.com" },
    update: {},
    create: {
      email: "salman@doveryet.com",
      name: "Salman B.",
      role: "SUPER_ADMIN",
      passwordHash: salmanPw,
    },
  });

  const almas = await db.user.upsert({
    where: { email: "almas@doveryet.com" },
    update: {},
    create: {
      email: "almas@doveryet.com",
      name: "Almas",
      role: "SUPER_ADMIN",
      passwordHash: await hash("doveryet-csm"),
    },
  });

  const asrar = await db.user.upsert({
    where: { email: "asrar@doveryet.com" },
    update: {},
    create: {
      email: "asrar@doveryet.com",
      name: "Asrar",
      role: "SUPER_ADMIN",
      passwordHash: await hash("doveryet-tech"),
    },
  });

  // ---------- Sample School: Riverside Secondary ----------
  const school = await db.school.upsert({
    where: { slug: "riverside-secondary" },
    update: {},
    create: {
      slug: "riverside-secondary",
      name: "Riverside Secondary School",
      city: "Chennai",
      state: "Tamil Nadu",
      schoolType: "Secondary (6–10)",
      board: "CBSE",
      logoUrl: "/doveryet-logo.jpg", // placeholder; real registration uploads to Blob
      email: "principal@riverside.edu",
      phone: "+919840000001",
      establishedYear: 1998,
      status: "ACTIVE",
      onboardingStage: "LIVE",
      onboardedAt: new Date("2026-01-14"),
      csmId: almas.id,
    },
  });

  // Payment details (Milestone 1)
  await db.schoolPaymentDetails.upsert({
    where: { schoolId: school.id },
    update: {},
    create: {
      schoolId: school.id,
      collectionMode: "BOTH",
      upiVpa: "riverside@okaxis",
      upiPhone: "+919840000001",
      bankAccountHolder: "Riverside Secondary School Trust",
      bankName: "HDFC Bank",
      bankBranch: "Anna Nagar, Chennai",
      bankAccountNumber: "50100012345678",
      bankIfsc: "HDFC0001234",
      bankAccountType: "Savings",
    },
  });

  // Riverside is on Growth (per-student annual) — large school
  const studentCount = 1284;
  const pricePerStudentPaise = 8900; // ₹89 / student / year
  const annualTotal = pricePerStudentPaise * studentCount;
  await db.subscription.upsert({
    where: { schoolId: school.id },
    update: {},
    create: {
      schoolId: school.id,
      plan: "GROWTH",
      billingCycle: "ANNUAL",
      studentCount,
      pricePerStudentPaise,
      monthlyPricePaise: Math.round(annualTotal / 12),
      cycleTotalPaise: annualTotal,
      isLaunchOffer: false,
      whatsappAllowance: 2500,
      whatsappUsed: 1842,
      billingCycleAnchor: new Date("2026-01-15"),
      renewsAt: new Date("2027-01-15"),
    },
  });

  // ---------- A second school on the launch offer, to show both tiers ----------
  const miniSchool = await db.school.upsert({
    where: { slug: "little-minds-preprimary" },
    update: {},
    create: {
      slug: "little-minds-preprimary",
      name: "Little Minds Pre-Primary",
      city: "Trichy",
      state: "Tamil Nadu",
      email: "hello@littleminds.edu",
      status: "ACTIVE",
      onboardingStage: "LIVE",
      onboardedAt: new Date("2026-10-15"),
      csmId: almas.id,
    },
  });

  await db.subscription.upsert({
    where: { schoolId: miniSchool.id },
    update: {},
    create: {
      schoolId: miniSchool.id,
      plan: "MINI",
      billingCycle: "QUARTERLY", // 3 months, 10% off
      studentCount: 24,
      monthlyPricePaise: Math.round(34900 * 0.90), // ₹349 - 10% = ₹314
      pricePerStudentPaise: 0,
      cycleTotalPaise: Math.round(34900 * 0.90) * 3,
      isLaunchOffer: true,
      launchOfferLockedUntil: new Date("2027-12-31"),
      whatsappAllowance: 250,
      whatsappUsed: 48,
      billingCycleAnchor: new Date("2026-10-15"),
      renewsAt: new Date("2027-01-15"),
    },
  });

  // Academic Year
  const ay = await db.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "AY 2025–26" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "AY 2025–26",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2026-05-31"),
      isCurrent: true,
    },
  });

  // School Admin login
  const adminPw = await hash("admin123");
  const schoolAdmin = await db.user.upsert({
    where: { email: "admin@riverside.edu" },
    update: {},
    create: {
      email: "admin@riverside.edu",
      name: "Dr. R. Vasudevan",
      phone: "+919840000002",
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
      passwordHash: adminPw,
    },
  });

  // Teacher login
  const teacher = await db.user.upsert({
    where: { email: "priya@riverside.edu" },
    update: {},
    create: {
      email: "priya@riverside.edu",
      name: "Priya Lakshmi",
      phone: "+919840000003",
      role: "TEACHER",
      schoolId: school.id,
      passwordHash: await hash("teacher123"),
    },
  });

  // ---------- Classes ----------
  const classConfigs = [
    { grade: 6, section: "A" },
    { grade: 7, section: "A" },
    { grade: 8, section: "A" },
    { grade: 8, section: "B" },
    { grade: 9, section: "A" },
    { grade: 10, section: "C" },
  ];

  const classes = await Promise.all(
    classConfigs.map((c) =>
      db.class.upsert({
        where: {
          schoolId_academicYearId_grade_section: {
            schoolId: school.id,
            academicYearId: ay.id,
            grade: c.grade,
            section: c.section,
          },
        },
        update: {},
        create: {
          schoolId: school.id,
          academicYearId: ay.id,
          grade: c.grade,
          section: c.section,
          name: `Grade ${c.grade}-${c.section}`,
          classTeacherId: teacher.id,
        },
      }),
    ),
  );

  // ---------- Students + Parents ----------
  const sampleStudents = [
    { first: "Rahul", last: "Kumar", class: "Grade 8-B", parent: "Rajesh Kumar" },
    { first: "Priya", last: "Sharma", class: "Grade 6-A", parent: "Sunita Sharma" },
    { first: "Arjun", last: "Nair", class: "Grade 10-C", parent: "Suresh Nair" },
    { first: "Meera", last: "Iyer", class: "Grade 7-A", parent: "Krishnan Iyer" },
    { first: "Vikram", last: "Reddy", class: "Grade 9-A", parent: "Ravi Reddy" },
    { first: "Kavya", last: "Subramaniam", class: "Grade 6-A", parent: "Lakshmi Subramaniam" },
    { first: "Deepak", last: "Pandian", class: "Grade 10-C", parent: "Murugan Pandian" },
    { first: "Anjali", last: "Menon", class: "Grade 8-A", parent: "Ramesh Menon" },
  ];

  for (let i = 0; i < sampleStudents.length; i++) {
    const s = sampleStudents[i];
    const klass = classes.find((c) => c.name === s.class)!;
    const admissionNo = `ADM-2024-${String(i + 1).padStart(4, "0")}`;

    const parent = await db.user.upsert({
      where: { email: `parent-${i}@riverside.edu` },
      update: {},
      create: {
        email: `parent-${i}@riverside.edu`,
        name: s.parent,
        phone: `+91984000${String(1000 + i).slice(-4)}`,
        role: "PARENT",
        schoolId: school.id,
        passwordHash: await hash("parent123"),
      },
    });

    const existing = await db.student.findUnique({
      where: { schoolId_admissionNo: { schoolId: school.id, admissionNo } },
    });
    if (existing) continue;

    await db.student.create({
      data: {
        schoolId: school.id,
        admissionNo,
        firstName: s.first,
        lastName: s.last,
        classId: klass.id,
        rollNo: i + 1,
        admissionDate: new Date("2024-06-15"),
        parents: {
          create: {
            parentId: parent.id,
            relation: "Father",
            isPrimary: true,
          },
        },
      },
    });
  }

  // ---------- Fee structure + invoices ----------
  const feeStruct = await db.feeStructure.upsert({
    where: { schoolId_academicYearId_grade: { schoolId: school.id, academicYearId: ay.id, grade: 8 } },
    update: {},
    create: {
      schoolId: school.id,
      academicYearId: ay.id,
      grade: 8,
      name: "Grade 8 fees",
      items: {
        create: [
          { label: "Tuition Fee", amount: 900000, period: "Term 2" }, // ₹9,000
          { label: "Lab Fee", amount: 150000, period: "Term 2" },
          { label: "Library & Sports", amount: 120000, period: "Term 2" },
          { label: "Transport Fee", amount: 80000, period: "Term 2" },
        ],
      },
    },
  });

  const sampleStudent = await db.student.findFirst({
    where: { schoolId: school.id, admissionNo: "ADM-2024-0001" },
  });

  if (sampleStudent) {
    const existingInv = await db.invoice.findFirst({
      where: { schoolId: school.id, studentId: sampleStudent.id, invoiceNumber: "INV-2026-00482" },
    });
    if (!existingInv) {
      await db.invoice.create({
        data: {
          schoolId: school.id,
          academicYearId: ay.id,
          invoiceNumber: "INV-2026-00482",
          studentId: sampleStudent.id,
          dueDate: new Date("2026-11-15"),
          subtotal: 1250000,
          total: 1250000,
          status: "OVERDUE",
          items: {
            create: [
              { label: "Tuition Fee", period: "Term 2", unitAmount: 900000, amount: 900000 },
              { label: "Lab Fee", period: "Term 2", unitAmount: 150000, amount: 150000 },
              { label: "Library & Sports", period: "Term 2", unitAmount: 120000, amount: 120000 },
              { label: "Transport Fee", period: "Term 2", unitAmount: 80000, amount: 80000 },
            ],
          },
        },
      });
    }
  }

  console.log("✅ Seed complete.");
  console.log("");
  console.log("Logins:");
  console.log("  Super Admin:   salman@doveryet.com / doveryet-admin");
  console.log("  Super Admin:   almas@doveryet.com  / doveryet-csm");
  console.log("  Super Admin:   asrar@doveryet.com  / doveryet-tech");
  console.log("  School Admin:  admin@riverside.edu / admin123");
  console.log("  Teacher:       priya@riverside.edu / teacher123");
  console.log("  Parent:        parent-0@riverside.edu / parent123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
