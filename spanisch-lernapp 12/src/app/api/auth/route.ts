// Registrierung/Login wurde durch auswählbare Profile ersetzt (siehe /api/profiles).
// Dieser Endpunkt ist deaktiviert.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Login entfernt — bitte Profile verwenden." }, { status: 410 });
}
