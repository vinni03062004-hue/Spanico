// Schuetzt App-Routen: ohne gueltige Session -> /login.
// Prueft nur die Existenz des Session-Cookies (leichtgewichtig, Edge-tauglich);
// die eigentliche Verifikation passiert in den API-Routen/Server-Komponenten.
import { NextRequest, NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";

const PUBLIC = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();
  const hasCookie = req.cookies.has(COOKIE);
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Alles ausser statischen Assets und Auth-API absichern.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|api/seed).*)"],
};
