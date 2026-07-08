import { NextResponse } from "next/server";
import { getOptionalMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type UcumRow = {
  code: string;
  display_name: string | null;
  common_synonym: string | null;
  unit_type: string | null;
};

export async function GET(req: Request) {
  const context = await getOptionalMember();
  if (!context?.member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const sb = supabaseAdmin();
  const like = `%${query}%`;
  const { data, error } = await sb
    .from("ucum_units")
    .select("code, display_name, common_synonym, unit_type")
    .or(`code.ilike.${like},display_name.ilike.${like},common_synonym.ilike.${like},unit_type.ilike.${like}`)
    .eq("status", "Active")
    .limit(50);

  if (error) {
    console.error("[codes/ucum] lookup failed", error);
    return NextResponse.json({ error: error.message, results: [] }, { status: 500 });
  }

  const q = query.toLowerCase();
  const results = ((data || []) as UcumRow[])
    .sort((a, b) => {
      const aText = `${a.code} ${a.display_name || ""} ${a.common_synonym || ""} ${a.unit_type || ""}`.toLowerCase();
      const bText = `${b.code} ${b.display_name || ""} ${b.common_synonym || ""} ${b.unit_type || ""}`.toLowerCase();
      const score = (row: UcumRow, text: string) =>
        row.code.toLowerCase() === q ? 0 : row.code.toLowerCase().startsWith(q) ? 1 : text.includes(q) ? 2 : 3;
      return score(a, aText) - score(b, bText) || a.code.localeCompare(b.code);
    })
    .slice(0, 20)
    .map((row) => ({
      code: row.code,
      display_name: row.display_name,
      common_synonym: row.common_synonym,
      unit_type: row.unit_type,
    }));

  return NextResponse.json({ results });
}
