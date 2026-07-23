import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppLayout } from "@/components/layout/app-layout";

import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import FarmersPage from "@/pages/Farmers";
import SuppliersPage from "@/pages/Suppliers";
import CustomersPage from "@/pages/Customers";
import PurchasesPage from "@/pages/Purchases";
import SalesPage from "@/pages/Sales";
import WarehousePage from "@/pages/Warehouse";
import ExpensesPage from "@/pages/Expenses";
import IncomePage from "@/pages/Income";
import ReportsPage from "@/pages/Reports";
import SettingsPage from "@/pages/Settings";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/farmers" element={<FarmersPage />} />
                  <Route path="/suppliers" element={<SuppliersPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/purchases" element={<PurchasesPage />} />
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/warehouse" element={<WarehousePage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/income" element={<IncomePage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </HashRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
