import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Home() {
  const s = await getSession();
  if (!s) redirect("/login");
  const profile = await prisma.languageProfile.findUnique({ where: { userId: s.userId } });
  redirect(profile ? "/dashboard" : "/onboarding");
}
