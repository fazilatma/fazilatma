import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/session-cookie-options";

function clearSession(response: NextResponse, request: Request) {
  const options = sessionCookieOptions(request, 0);
  response.cookies.set("optibid_admin", "", options);
  response.cookies.set("optibid_user", "", options);
  return response;
}

export async function POST(request: Request) {
  return clearSession(NextResponse.json({ success: true, nextUrl: "/" }), request);
}

export async function GET(request: Request) {
  return clearSession(NextResponse.redirect(new URL("/", request.url)), request);
}
