import { NextResponse, type NextRequest } from "next/server";
import { JOURNEY_COOKIE, isJourneyPath } from "@/lib/journey";

const REF_COOKIE = "bac-ref";

/**
 * Until someone has been through welcome → sign in → questions → checkout, the home address
 * (http://localhost:3000) shows the welcome page, and every other app page sends them there.
 * Afterwards the same address shows Discover. A `?ref=CODE` link remembers who invited them.
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const done = req.cookies.get(JOURNEY_COOKIE)?.value === "done";

  let res: NextResponse;
  if (done || isJourneyPath(pathname)) res = NextResponse.next();
  // Serve the welcome page at "/" itself, keeping the address bar on the bare site address.
  else if (pathname === "/") res = NextResponse.rewrite(new URL("/welcome", req.url));
  else res = NextResponse.redirect(new URL("/", req.url));

  const ref = searchParams.get("ref")?.toUpperCase();
  if (ref && /^[A-Z0-9]{6,12}$/.test(ref) && !req.cookies.has(REF_COOKIE)) {
    res.cookies.set(REF_COOKIE, ref, { maxAge: 60 * 60 * 24 * 60, sameSite: "lax", path: "/", httpOnly: true });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
