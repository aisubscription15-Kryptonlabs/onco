import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Clinic lifecycle controls are not enabled for this setup." },
    { status: 404 },
  );
}
