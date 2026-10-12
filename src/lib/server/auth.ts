import { NextRequest, NextResponse } from "next/server";

export const isAuthorized = (request: NextRequest) =>
  request.headers.get("x-upload-password") === process.env.UPLOAD_PASSWORD;

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
