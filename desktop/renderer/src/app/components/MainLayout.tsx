import { Outlet, useLocation, useNavigate } from "react-router";
import { BarChart3, Database, LogOut, Users } from "lucide-react";
import { useApp } from "../context/AppContext";

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useApp();

  const navItems = [
    { path: "/", label: "Clienti", icon: Users, match: ["/", "/clienti"] },
    { path: "/statistiche", label: "Statistiche", icon: BarChart3, match: ["/statistiche"] },
    { path: "/dizionario", label: "Tabelle", icon: Database, match: ["/dizionario"] },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (matches: string[]) => {
    return matches.some((path) =>
      path === "/"
        ? location.pathname === "/" || location.pathname.startsWith("/clienti")
        : location.pathname.startsWith(path)
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      {/* Navbar superiore: sostituisce la vecchia sidebar e lascia piu spazio alle tabelle. */}
      <header className="bg-white border-b border-gray-200">
        <div className="h-16 px-6 flex items-center justify-between gap-6">
          <div className="shrink-0">
            <p className="text-xs uppercase tracking-wide text-gray-500">Gestionale</p>
            <h1 className="text-xl font-semibold text-gray-950 leading-tight">Convert</h1>
          </div>

          <nav className="flex flex-1 items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.match);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    active
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
