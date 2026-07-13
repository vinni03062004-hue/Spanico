// Schuetzt App-Routen: ohne gueltige Session -> /login.
// Prueft nur die Existenz des Session-Cookies (leichtgewichtig, Edge-tauglich);
// die eigentliche Verifikation passiert in den API-Routen/Server-Komponenten.
import { NextRequest, NextResponse } from "next/server";
import { COOKIE } from "@/lib/constants";

const PUBLIC = ["/profiles"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();
  const hasCookie = req.cookies.has(COOKIE);
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/profiles";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Alles absichern ausser: statische Assets, Profil-API (Auswahl vor Login)
  // und Seed-API.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/profiles|api/seed).*)"],
};
