import { NextResponse } from "next/server";
import { getOptionalMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type IcdRow = {
  code: string;
  name: string;
};

export async function GET(req: Request) {
  const context = await getOptionalMember();
  if (!context?.member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawQuery = new URL(req.url).searchParams.get("q")?.trim() || "";
  const codeTokens = icdCodeTokens(rawQuery);
  const query = firstSearchToken(rawQuery);
  if (query.length < 2 && codeTokens.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const sb = supabaseAdmin();
  let data: unknown[] | null = null;
  let error: { code?: string; message: string } | null = null;

  if (codeTokens.length > 1) {
    const result = await sb
      .from("icd_codes")
      .select("code, name")
      .in("code", codeTokens.map((code) => code.toUpperCase()))
      .eq("status", "active")
      .limit(50);
    data = result.data;
    error = result.error;
  } else {
    const like = `%${escapePostgrestLike(query)}%`;
    const result = await sb
      .from("icd_codes")
      .select("code, name")
      .or(`code.ilike.${like},name.ilike.${like}`)
      .eq("status", "active")
      .limit(50);
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error("[codes/icd] lookup failed", error);
    return NextResponse.json(
      {
        error:
          error.code === "42P01"
            ? "ICD table icd_codes was not found in Supabase."
            : error.message,
        results: [],
      },
      { status: 500 },
    );
  }

  const q = query.toLowerCase();
  let rows = (data || []) as IcdRow[];

  if (rows.length === 0 && /^[A-Z]\d{2}\.\w+$/i.test(query)) {
    const parentCode = query.split(".")[0];
    const { data: parentRows, error: parentError } = await sb
      .from("icd_codes")
      .select("code, name")
      .eq("code", parentCode.toUpperCase())
      .eq("status", "active")
      .limit(1);

    if (!parentError && parentRows?.length) {
      rows = parentRows as IcdRow[];
    }
  }

  const results = rows
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aCode = a.code.toLowerCase();
      const bCode = b.code.toLowerCase();
      const score = (name: string, code: string) =>
        code === q ? 0 : name === q ? 1 : name.startsWith(q) ? 2 : code.startsWith(q) ? 3 : 4;
      return score(aName, aCode) - score(bName, bCode) || a.code.localeCompare(b.code);
    })
    .slice(0, 20);

  return NextResponse.json({ results });
}

function icdCodeTokens(query: string) {
  return Array.from(
    new Set(
      query
        .split(/[,\s]+/)
        .map((part) => part.trim().toUpperCase())
        .filter((part) => /^[A-Z]\d{2}(?:\.\w+)?$/i.test(part)),
    ),
  );
}

function firstSearchToken(query: string) {
  const code = icdCodeTokens(query)[0];
  if (code) return code;
  return query.split(",")[0]?.trim() || query;
}

function escapePostgrestLike(value: string) {
  return value.replace(/[%*,()]/g, " ").replace(/\s+/g, " ").trim();
}
