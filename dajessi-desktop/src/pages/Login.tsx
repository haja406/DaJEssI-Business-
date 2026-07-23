import * as React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";

export default function LoginPage() {
  const { user, login, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch {
      // error already surfaced via AuthContext
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-brand text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative flex items-center gap-2">
          <Sprout className="h-7 w-7 text-gold" />
          <span className="font-display text-xl font-semibold">DaJEssI Business</span>
        </div>
        <div className="relative space-y-3 max-w-md">
          <p className="font-display text-3xl leading-tight">
            La gestion complète de votre collecte de riz — 100% hors-ligne.
          </p>
          <p className="text-white/70 text-sm">
            Agriculteurs, achats, entrepôt, ventes, dépenses et rapports — tout fonctionne sans connexion internet.
          </p>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} DaJEssy&apos;Varotra</p>
      </div>

      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <Sprout className="h-6 w-6 text-brand" />
            <span className="font-display text-lg font-semibold text-brand-dark">DaJEssI Business</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-brand-dark dark:text-white">Connexion</h1>
            <p className="text-sm text-muted-foreground mt-1">Accédez à votre espace de gestion local.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Nom d&apos;utilisateur</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Compte par défaut : <code>admin</code> / <code>admin123</code> — à changer dans Paramètres.
          </p>
        </div>
      </div>
    </div>
  );
}
