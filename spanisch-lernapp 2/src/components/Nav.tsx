"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/vokabeln", "Vokabeln"],
  ["/bilder", "Bilder"],
  ["/aussprache", "Aussprache"],
  ["/shadowing", "Shadowing"],
  ["/jarvis", "Jarvis"],
  ["/hoeren", "Hören"],
  ["/satzbau", "Satzbau"],
  ["/konjugation", "Konjugation"],
  ["/pruefung", "Prüfung"],
  ["/fehler", "Fehler"],
  ["/fortschritt", "Fortschritt"],
  ["/admin", "Admin"],
];

export function Nav() {
  const path = usePathname();
  if (path === "/" || path === "/login" || path === "/onboarding") return null;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-base/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href="/dashboard" className="font-semibold tracking-tight text-primary shrink-0">
          ● Español Coach
        </Link>
        <nav className="flex-1 overflow-x-auto">
          <ul className="flex items-center gap-1 text-sm">
            {LINKS.map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                    path === href ? "bg-surface2 text-primary" : "text-muted hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action="/api/auth/logout" method="post">
          <button className="btn-ghost btn text-sm" type="submit">Abmelden</button>
        </form>
      </div>
    </header>
  );
}
