import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Truck, UserCircle, ShoppingCart, Receipt,
  Warehouse, Wallet, TrendingUp, FileBarChart, Settings, Sprout,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/farmers", label: "Agriculteurs", icon: Users },
  { to: "/suppliers", label: "Fournisseurs", icon: Truck },
  { to: "/customers", label: "Clients", icon: UserCircle },
  { to: "/purchases", label: "Achats", icon: ShoppingCart },
  { to: "/sales", label: "Ventes", icon: Receipt },
  { to: "/warehouse", label: "Entrepôt / Stock", icon: Warehouse },
  { to: "/expenses", label: "Dépenses", icon: Wallet },
  { to: "/income", label: "Revenus", icon: TrendingUp },
  { to: "/reports", label: "Rapports", icon: FileBarChart },
  { to: "/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 flex flex-col bg-brand text-white h-full no-print">
      <div className="flex items-center gap-2 px-5 h-14 border-b border-white/10 shrink-0">
        <Sprout className="h-5 w-5 text-gold" />
        <span className="font-display text-base font-semibold">DaJEssI</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-gold text-brand-dark font-semibold" : "text-white/80 hover:bg-white/10 hover:text-white"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10 text-[11px] text-white/50 shrink-0">
        DaJEssy&apos;Varotra — hors-ligne
      </div>
    </aside>
  );
}
