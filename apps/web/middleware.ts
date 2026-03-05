import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/trade"];
const authRoutes = ["/signin", "/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL("/trade", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/trade/:path*", "/signin", "/register"],
};
