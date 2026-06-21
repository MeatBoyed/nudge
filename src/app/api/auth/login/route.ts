import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassphrase,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { passphrase } = await request.json();

  if (typeof passphrase !== "string" || !(await verifyPassphrase(passphrase))) {
    return NextResponse.json({ error: "Invalid passphrase" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}
