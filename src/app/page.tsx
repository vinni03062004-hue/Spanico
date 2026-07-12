import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Home() {
  const s = await getSession();
  if (!s) redirect("/profiles");
  // Falls das gewählte Profil zwischenzeitlich gelöscht wurde -> zurück zur Auswahl.
  const user = await prisma.user.findUnique({ where: { id: s.userId }, select: { id: true } });
  if (!user) redirect("/profiles");
  const profile = await prisma.languageProfile.findUnique({ where: { userId: s.userId } });
  redirect(profile ? "/dashboard" : "/onboarding");
}
