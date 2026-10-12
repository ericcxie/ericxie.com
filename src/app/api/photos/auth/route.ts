import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, unauthorized } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();
  return NextResponse.json({ ok: true });
}
