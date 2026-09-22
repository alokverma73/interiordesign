import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell, Calendar, FileText, FolderOpen, LayoutDashboard, LogOut, Menu, MessageSquare, Settings, X,
} from "lucide-react";
import { api } from "@/api/client";
import { useAuthStore } from "@/contexts/authStore";
import Seo from "@/components/Seo";
import ErrorBoundary from "@/components/ErrorBoundary";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/projects", label: "My Projects", icon: FolderOpen },
  { to: "/dashboard/enquiries", label: "My Enquiries", icon: FileText },
  { to: "/dashboard/appointments", label: "Appointments", icon: Calendar },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/profile", label: "Profile", icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get("/notifications/unread-count").then((r) => setUnread(r.data.count)).catch(() => null);
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-sand-50 flex">
      <Seo title="Client Portal" noIndex />
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-charcoal-950 text-sand-200 z-40 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="font-display text-lg text-sand-50">Aetherlume</Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 mt-4 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm rounded transition-colors ${
                  isActive ? "bg-sand-50/10 text-sand-50" : "hover:bg-sand-50/5"
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
              {item.label === "Notifications" && unread > 0 && (
                <span className="ml-auto bg-clay-500 text-sand-50 text-[10px] px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sand-100/10">
          <p className="text-xs text-sand-300/60 px-3 mb-2">{user?.full_name}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm w-full hover:bg-sand-50/5 rounded transition-colors"
          >
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-charcoal-950/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-charcoal-900/10 flex items-center justify-between px-6 bg-sand-50 sticky top-0 z-20">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <p className="text-sm text-charcoal-700/70 hidden lg:block">Client Portal</p>
          <Link to="/quote" className="btn-primary !py-2 !px-4 text-xs">New Enquiry</Link>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-6 lg:p-10"
        >
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </motion.main>
      </div>
    </div>
  );
}
