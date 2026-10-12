import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, unauthorized } from "@/lib/server/auth";
import { dispatchPhotoSync } from "@/lib/server/github";

// Re-runs the Blob → repo sync by hand, e.g. after a failed action
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN is not configured" },
      { status: 500 },
    );
  }

  const res = await dispatchPhotoSync(token);
  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      {
        error: `GitHub API error: ${res.status} ${res.statusText}`,
        detail: body,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
