import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * MILESTONE 2 — Student bulk upload template.
 * Returns a CSV with the columns admin fills in.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.schoolId) return new NextResponse("Unauthorized", { status: 401 });

  const headers = [
    "First Name",
    "Last Name",
    "Date of Birth (YYYY-MM-DD)",
    "Gender (Male/Female/Other)",
    "Class (e.g. Grade 8-B)",
    "Roll No",
    "Blood Group (A+, A-, B+, B-, O+, O-, AB+, AB-, Unknown)",
    "Address",
    "Parent Name",
    "Parent Mobile (+91...)",
    "Parent Email",
    "Parent Relation (Father/Mother/Guardian)",
  ];

  const sample = [
    "Rahul",
    "Kumar",
    "2012-05-14",
    "Male",
    "Grade 8-B",
    "24",
    "O+",
    "Flat 4A, 12 Main Rd, Chennai 600001",
    "Rajesh Kumar",
    "+919840012345",
    "rajesh@example.com",
    "Father",
  ];

  const csv = headers.map((h) => `"${h}"`).join(",") + "\n" + sample.map((v) => `"${v}"`).join(",") + "\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="student-template.csv"',
    },
  });
}
