import { NextResponse } from "next/server";
import { getOptionalMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type LoincRow = {
  loinc_num: string;
  component: string | null;
  long_common_name: string | null;
  shortname: string | null;
  display_name: string | null;
  example_ucum_units: string | null;
};

type UcumRow = {
  code: string;
  display_name: string | null;
};

export async function GET(req: Request) {
  const context = await getOptionalMember();
  if (!context?.member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const sb = supabaseAdmin();
  const like = `%${query}%`;
  const { data, error } = await sb
    .from("loinc_codes")
    .select("loinc_num, component, long_common_name, shortname, display_name, example_ucum_units")
    .or(`loinc_num.ilike.${like},component.ilike.${like},long_common_name.ilike.${like},shortname.ilike.${like},display_name.ilike.${like}`)
    .eq("status", "ACTIVE")
    .limit(80);

  if (error) {
    console.error("[codes/loinc] lookup failed", error);
    return NextResponse.json(
      {
        error:
          error.code === "42P01"
            ? "LOINC table loinc_codes was not found in Supabase."
            : error.message,
        results: [],
      },
      { status: 500 },
    );
  }

  const q = query.toLowerCase();
  const rows = ((data || []) as LoincRow[])
    .sort((a, b) => {
      const aText = `${a.display_name || ""} ${a.shortname || ""} ${a.component || ""} ${a.long_common_name || ""}`.toLowerCase();
      const bText = `${b.display_name || ""} ${b.shortname || ""} ${b.component || ""} ${b.long_common_name || ""}`.toLowerCase();
      const aCode = a.loinc_num.toLowerCase();
      const bCode = b.loinc_num.toLowerCase();
      const score = (text: string, code: string) =>
        code === q ? 0 : text.startsWith(q) ? 1 : code.startsWith(q) ? 2 : text.includes(q) ? 3 : 4;
      return score(aText, aCode) - score(bText, bCode) || a.loinc_num.localeCompare(b.loinc_num);
    })
    .slice(0, 30);
  const unitCodes = Array.from(
    new Set(rows.map((row) => row.example_ucum_units).filter(Boolean)),
  ) as string[];
  const { data: ucumRows } =
    unitCodes.length > 0
      ? await sb
          .from("ucum_units")
          .select("code, display_name")
          .in("code", unitCodes)
      : { data: [] as UcumRow[] };
  const ucumByCode = new Map(((ucumRows || []) as UcumRow[]).map((unit) => [unit.code, unit.display_name]));

  const results = rows.map((row) => ({
    test_name: row.display_name || row.shortname || row.component || row.long_common_name,
    loinc_code: row.loinc_num,
    loinc_name: row.long_common_name || row.display_name || row.shortname || row.component,
    ucum_unit: row.example_ucum_units,
    ucum_name: row.example_ucum_units ? ucumByCode.get(row.example_ucum_units) || null : null,
  }));

  return NextResponse.json({ results });
}
