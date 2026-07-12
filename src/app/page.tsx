import { redirect } from "next/navigation";

// Beim Öffnen der App IMMER die Profilauswahl zeigen (jedes Mal neu wählen).
// Nach der Auswahl geht es weiter zu Dashboard bzw. Onboarding.
export default function Home() {
  redirect("/profiles");
}
