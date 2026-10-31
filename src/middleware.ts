import { NextResponse, type NextRequest } from "next/server";
import { JOURNEY_COOKIE, isJourneyPath } from "@/lib/journey";

/**
 * Until someone has been through welcome → sign in → questions → checkout, the home address
 * (http://localhost:3000) shows the welcome page, and every other app page sends them there.
 * Afterwards the same address shows Discover.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const done = req.cookies.get(JOURNEY_COOKIE)?.value === "done";
  if (done || isJourneyPath(pathname)) return NextResponse.next();
  // Serve the welcome page at "/" itself, keeping the address bar on the bare site address.
  if (pathname === "/") return NextResponse.rewrite(new URL("/welcome", req.url));
  return NextResponse.redirect(new URL("/", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
