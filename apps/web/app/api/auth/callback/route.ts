import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Redirect to /trade and set the auth cookie on this domain
  const response = NextResponse.redirect(new URL("/trade", request.url));

  response.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  });

  return response;
}
