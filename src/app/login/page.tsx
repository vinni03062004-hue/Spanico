import { redirect } from "next/navigation";

// Login/Registrierung wurde durch auswählbare Profile ersetzt.
// Diese Seite leitet nur noch auf die Profil-Auswahl weiter.
export default function LoginRedirect() {
  redirect("/profiles");
}
