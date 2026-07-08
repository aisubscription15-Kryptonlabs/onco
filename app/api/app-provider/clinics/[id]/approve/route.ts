import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Clinic approval flow is not enabled for this setup." },
    { status: 404 },
  );
}
