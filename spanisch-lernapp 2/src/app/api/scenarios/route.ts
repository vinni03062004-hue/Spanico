import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";

export async function GET() {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const scenarios = await prisma.scenario.findMany({ orderBy: { difficulty: "asc" } });
  return NextResponse.json({ scenarios });
}
