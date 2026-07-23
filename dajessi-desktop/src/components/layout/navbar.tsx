import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun, DatabaseBackup, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth, ROLE_LABELS } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/ui/toaster";

const TITLES: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/farmers": "Agriculteurs",
  "/suppliers": "Fournisseurs",
  "/customers": "Clients",
  "/purchases": "Achats",
  "/sales": "Ventes",
  "/warehouse": "Entrepôt / Stock",
  "/expenses": "Dépenses",
  "/income": "Revenus",
  "/reports": "Rapports",
  "/settings": "Paramètres",
};

declare global {
  interface Window {
    desktop?: {
      backup: () => Promise<string>;
      backupTo: () => Promise<string | null>;
      restore: () => Promise<string | null>;
      getVersion: () => Promise<string>;
      onShortcutBackup: (cb: () => void) => () => void;
    };
  }
}

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const pageTitle = TITLES[location.pathname] ?? "DaJEssI Business";

  async function handleBackup() {
    try {
      const dest = await window.desktop?.backup();
      toast({ title: "Sauvegarde effectuée", description: dest ?? undefined, variant: "success" });
    } catch {
      toast({ title: "Échec de la sauvegarde", variant: "error" });
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 shrink-0 no-print">
      <h1 className="font-display text-base font-semibold text-brand-dark dark:text-white">{pageTitle}</h1>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" title="Sauvegarder la base de données" onClick={handleBackup}>
          <DatabaseBackup className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Changer le thème" onClick={toggle}>
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
              <UserCircle2 className="h-6 w-6 text-brand" />
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium">{user?.fullName}</span>
                {user && <Badge variant="gold" className="text-[10px] py-0">{ROLE_LABELS[user.role]}</Badge>}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => { logout(); navigate("/login"); }}>
              <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
