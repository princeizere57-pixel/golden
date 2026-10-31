import { NextResponse, type NextRequest } from "next/server";
import { JOURNEY_COOKIE, isJourneyPath } from "@/lib/journey";

/** Until someone has been through welcome → sign in → questions → checkout, send them to /welcome. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isJourneyPath(pathname) || req.cookies.get(JOURNEY_COOKIE)?.value === "done") return NextResponse.next();
  return NextResponse.redirect(new URL("/welcome", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
