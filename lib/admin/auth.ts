import { notFound, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import type { Clinic, Doctor } from "@/types/db";

export async function requireClinicAdmin(): Promise<{
  userId: string;
  email: string;
  admin: Doctor;
  clinic: Clinic;
}> {
  const { userId, email, member, clinic } = await requireMember();

  if (member.role !== "admin") {
    notFound();
  }

  if (!member.clinic_id || member.clinic_id !== clinic.id) {
    redirect("/staff/login");
  }

  return {
    userId,
    email,
    admin: member,
    clinic,
  };
}
