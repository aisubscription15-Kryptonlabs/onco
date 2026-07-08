export type MedicineSearchRow = {
  id: string;
  name: string;
  generic_name?: string | null;
  manufacturer_name?: string | null;
  manufacturer?: string | null;
  type?: string | null;
  pack_size_label?: string | null;
  pack_size?: string | null;
  short_composition1?: string | null;
  short_composition2?: string | null;
  salt_composition?: string | null;
  composition?: string | null;
  price?: number | string | null;
  prescription_required?: boolean | null;
  rx_required?: boolean | null;
};

export const pharmacyDash = "-";

export function medicineComposition(medicine: MedicineSearchRow) {
  return (
    medicine.salt_composition ||
    medicine.composition ||
    [medicine.short_composition1, medicine.short_composition2].filter(Boolean).join(" + ") ||
    medicine.generic_name ||
    pharmacyDash
  );
}

export async function searchMedicines(term: string, limit = 20) {
  const q = term.trim();
  if (q.length < 2) return { data: [] as MedicineSearchRow[], error: "" };

  const params = new URLSearchParams({ q, limit: String(limit) });
  const response = await fetch(`/api/pharmacy/search?${params.toString()}`);
  const payload = (await response.json().catch(() => ({}))) as {
    data?: MedicineSearchRow[];
    error?: string;
  };

  if (!response.ok) {
    return { data: [] as MedicineSearchRow[], error: payload.error || "Medicine search failed" };
  }

  return { data: payload.data || [], error: "" };
}

export async function createCustomMedicine(input: {
  name: string;
  composition: string;
  manufacturer: string;
  type: string;
  pack: string;
  price: string;
  prescriptionRequired: boolean;
}) {
  const response = await fetch("/api/pharmacy/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    data?: MedicineSearchRow;
    error?: string;
  };

  if (!response.ok || !payload.data) {
    return { data: null, error: payload.error || "Could not add medicine" };
  }

  return { data: payload.data, error: "" };
}
