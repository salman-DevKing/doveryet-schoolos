"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSchoolUser } from "@/lib/tenant";
import { admissionNumber } from "@/lib/utils";

const studentSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  classId: z.string().optional(),
  rollNo: z.coerce.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  parentName: z.string().min(1, "Parent name required"),
  parentPhone: z.string().min(10, "Parent phone required"),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentRelation: z.string().default("Guardian"),
});

export type StudentFormState =
  | { ok: true; studentId: string }
  | { ok: false; error: string; fields?: Partial<Record<string, string>> }
  | undefined;

export async function createStudent(_prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const session = await requireSchoolUser();
  const schoolId = session.user.schoolId;

  const parsed = studentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])),
    };
  }

  const data = parsed.data;

  // Generate next admission number for this school
  const yearPrefix = `ADM-${new Date().getFullYear()}-`;
  const lastStudent = await db.student.findFirst({
    where: { schoolId, admissionNo: { startsWith: yearPrefix } },
    orderBy: { admissionNo: "desc" },
    select: { admissionNo: true },
  });
  const lastSeq = lastStudent ? parseInt(lastStudent.admissionNo.split("-").pop() ?? "0") : 0;
  const admissionNo = admissionNumber(lastSeq + 1);

  const student = await db.$transaction(async (tx) => {
    // Create or find parent user
    const existingParent = data.parentEmail
      ? await tx.user.findUnique({ where: { email: data.parentEmail } })
      : null;

    const parent =
      existingParent ??
      (await tx.user.create({
        data: {
          email: data.parentEmail || `parent-${Date.now()}@noemail.schoolos`,
          name: data.parentName,
          phone: data.parentPhone,
          role: "PARENT",
          schoolId,
        },
      }));

    const student = await tx.student.create({
      data: {
        schoolId,
        admissionNo,
        firstName: data.firstName,
        lastName: data.lastName || null,
        dob: data.dob ? new Date(data.dob) : null,
        gender: data.gender,
        classId: data.classId || null,
        rollNo: data.rollNo || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        parents: {
          create: {
            parentId: parent.id,
            relation: data.parentRelation,
            isPrimary: true,
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        schoolId,
        userId: session.user.id,
        action: "student.create",
        entity: "Student",
        entityId: student.id,
        changes: { admissionNo, name: `${data.firstName} ${data.lastName ?? ""}` },
      },
    });

    return student;
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin/dashboard");
  redirect(`/admin/students/${student.id}`);
}

export async function deactivateStudent(studentId: string) {
  const session = await requireSchoolUser();
  const schoolId = session.user.schoolId;

  await db.student.update({
    where: { id: studentId, schoolId },
    data: { isActive: false },
  });

  await db.auditLog.create({
    data: {
      schoolId,
      userId: session.user.id,
      action: "student.deactivate",
      entity: "Student",
      entityId: studentId,
    },
  });

  revalidatePath("/admin/students");
}
