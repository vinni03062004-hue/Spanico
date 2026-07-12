import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST(req: Request) {
  clearSession();
  // 303 = "See Other": Browser wechselt nach dem POST auf GET /profiles
  // (sonst bleibt die POST-Methode erhalten -> weiße Seite).
  return NextResponse.redirect(new URL("/profiles", req.url), 303);
}
