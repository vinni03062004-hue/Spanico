"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: mode, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || "Fehler");
    router.push(data.needsOnboarding ? "/onboarding" : "/dashboard");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-primary text-3xl mb-2">●</div>
          <h1 className="h-title">Español Coach</h1>
          <p className="label mt-1">Wissenschaftlich fundiert. Kritisch bewertet. Mit Jarvis-Sprachmodus.</p>
        </div>
        <div className="flex gap-2 mb-4">
          <button className={`btn flex-1 ${mode === "login" ? "btn-primary" : ""}`} onClick={() => setMode("login")} type="button">Anmelden</button>
          <button className={`btn flex-1 ${mode === "register" ? "btn-primary" : ""}`} onClick={() => setMode("register")} type="button">Registrieren</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input className="input" type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <input className="input" type="password" placeholder="Passwort (min. 6 Zeichen)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="current-password" />
          {error && <p className="text-bad text-sm">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading} type="submit">
            {loading ? "…" : mode === "login" ? "Anmelden" : "Konto erstellen"}
          </button>
        </form>
      </div>
    </div>
  );
}
