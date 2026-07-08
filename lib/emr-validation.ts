import { z } from "zod";
 
const today = new Date();
today.setHours(0, 0, 0, 0);
 
const oldestAllowedBirthdate = new Date(today);
oldestAllowedBirthdate.setFullYear(today.getFullYear() - 130);
 
const nullableText = (label: string, max = 2000) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    },
    z.string(`${label} must be text.`).max(max, `${label} is too long.`).nullable(),
  );
 
const nullableName = (label: string) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    },
    z
      .string(`${label} must be text.`)
      .max(120, `${label} is too long.`)
      .regex(/^[A-Za-z\s]+$/, `${label} should contain letters and spaces only.`)
      .nullable(),
  );
 
const nullableAlphaText = (label: string, max = 120) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    },
    z
      .string(`${label} must be text.`)
      .max(max, `${label} is too long.`)
      .regex(/^[A-Za-z\s]+$/, `${label} should contain letters and spaces only.`)
      .nullable(),
  );
 
const nullableNumber = (label: string, min: number, max: number) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === "string" && value.trim() === "") return null;
      return Number(value);
    },
    z
      .number(`${label} must be a number.`)
      .finite(`${label} must be a number.`)
      .min(min, `${label} must be between ${min} and ${max}.`)
      .max(max, `${label} must be between ${min} and ${max}.`)
      .nullable(),
  );
 
const optionalBirthdate = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    return value;
  },
  z
    .string("Birthdate must be a date.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid birthdate.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00`);
      return !Number.isNaN(date.getTime()) && date <= today;
    }, "Birthdate cannot be in the future.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00`);
      return !Number.isNaN(date.getTime()) && date >= oldestAllowedBirthdate;
    }, "Birthdate must be within the last 130 years.")
    .nullable(),
);
 
const nullablePhone = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  },
  z.string().regex(/^[+0-9()\-\s]{7,20}$/, "Enter a valid phone number.").nullable(),
);
 
const nullableIndianPhone = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return !trimmed || trimmed === "+91" ? null : trimmed;
  },
  z.string().regex(/^\+91\d{10}$/, "Phone number must be +91 followed by 10 digits.").nullable(),
);
 
const nullableEmail = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  },
  z.string().email("Enter a valid email address.").max(254, "Email is too long.").nullable(),
);
 
const nullablePostalCode = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  },
  z
    .string()
    .regex(/^\d{6}$/, "Postal code must be 6 digits.")
    .nullable(),
);
 
const nullableAbhaId = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  },
  z
    .string()
    .regex(/^(\d{14}|\d{2}-\d{4}-\d{4}-\d{4})$/, "ABHA ID must be 14 digits.")
    .nullable(),
);
 
const nullableAbhaAddress = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  },
  z
    .string()
    .max(120, "ABHA address is too long.")
    .regex(/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/, "Enter a valid ABHA address.")
    .nullable(),
);
 
const nullableBloodGroup = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  },
  z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).nullable(),
);
 
export const emrPatientUpdateSchema = z
  .object({
    first_name: nullableName("First name"),
    last_name: nullableName("Last name"),
    full_name: z
      .string()
      .trim()
      .min(1, "Patient name is required.")
      .max(240, "Patient name is too long.")
      .regex(/^[A-Za-z][A-Za-z\s]*$/, "Patient name should contain letters and spaces only."),
    birthdate: optionalBirthdate,
    age: nullableNumber("Age", 0, 130),
    sex: z.enum(["M", "F", "O"]).nullable(),
    blood_group: nullableBloodGroup,
    height_cm: nullableNumber("Height", 0, 250),
    phone: nullableIndianPhone,
    email: nullableEmail,
    emergency_contact: nullableIndianPhone,
    address: nullableText("Address"),
    city: nullableAlphaText("City"),
    state: nullableAlphaText("State"),
    postal_code: nullablePostalCode,
    country: nullableAlphaText("Country"),
    abha_id: nullableAbhaId,
    abha_address: nullableAbhaAddress,
    known_allergies: nullableText("Known allergies"),
    chronic_conditions: nullableText("Chronic conditions"),
  })
  .strict();
 
export const emrVisitUpdateSchema = z
  .object({
    bp_systolic: nullableNumber("BP systolic", 40, 260),
    bp_diastolic: nullableNumber("BP diastolic", 20, 180),
    pulse: nullableNumber("Pulse", 20, 240),
    temperature_f: nullableNumber("Temperature", 80, 115),
    spo2: nullableNumber("SpO2", 50, 100),
    weight_kg: nullableNumber("Weight", 0, 400),
    chief_complaints: nullableText("Chief complaint"),
    doctor_id: z.string().uuid("Assigned doctor is invalid."),
  })
  .strict()
  .refine(
    (visit) =>
      (visit.bp_systolic == null && visit.bp_diastolic == null) ||
      (visit.bp_systolic != null && visit.bp_diastolic != null),
    { message: "Enter both systolic and diastolic BP.", path: ["bp_diastolic"] },
  );
 
export const emrAssignmentSchema = z
  .object({
    doctor_id: z.string().uuid("Assigned doctor is invalid."),
    role: z.enum(["attending", "resident", "consultant"]),
  })
  .strict();
 
export const emrIntakeUpdateSchema = z
  .object({
    patientId: z.string().uuid("Patient is invalid."),
    patient: emrPatientUpdateSchema,
    visit: emrVisitUpdateSchema,
    assignments: z.array(emrAssignmentSchema).min(1, "Assign at least one doctor."),
  })
  .strict()
  .superRefine((body, ctx) => {
    const seen = new Set<string>();
    body.assignments.forEach((assignment, index) => {
      if (seen.has(assignment.doctor_id)) {
        ctx.addIssue({
          code: "custom",
          message: "Each doctor can only be assigned once.",
          path: ["assignments", index, "doctor_id"],
        });
      }
      seen.add(assignment.doctor_id);
    });
  });
 
export const emrPatientIntakeSchema = emrPatientUpdateSchema.extend({
  clinic_id: z.string().uuid("Clinic is invalid."),
  doctor_id: z.string().uuid("Doctor is invalid."),
  phone: nullableIndianPhone,
  last_visit_at: z.string().datetime("Last visit date is invalid."),
});
 
export const emrPatientCreateSchema = emrPatientIntakeSchema.extend({
  emr_number: z.string().trim().min(1, "EMR number is required.").max(80),
});
 
export const emrVisitCreateSchema = emrVisitUpdateSchema.safeExtend({
  clinic_id: z.string().uuid("Clinic is invalid."),
  patient_id: z.string().uuid("Patient is invalid."),
  doctor_id: z.string().uuid("Doctor is invalid."),
  created_by: z.string().uuid("Created by is invalid."),
  visit_date: z.string().datetime("Visit date is invalid."),
  status: z.enum(["queued", "intake"]),
});
 
export type EmrPatientUpdate = z.infer<typeof emrPatientUpdateSchema>;
export type EmrVisitUpdate = z.infer<typeof emrVisitUpdateSchema>;
export type EmrIntakeUpdate = z.infer<typeof emrIntakeUpdateSchema>;
 
export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message || "Please check the highlighted details.";
}
 
 