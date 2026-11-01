import { NextResponse } from "next/server";

function clearSession(response: NextResponse) {
  response.cookies.set("optibid_admin", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("optibid_user", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST() {
  return clearSession(NextResponse.json({ success: true, nextUrl: "/" }));
}

export async function GET(request: Request) {
  return clearSession(NextResponse.redirect(new URL("/", request.url)));
}
