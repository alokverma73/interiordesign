import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell, Calendar, FileText, FolderKanban, Image, LayoutDashboard, LogOut, Menu,
  MessageSquare, Newspaper, Quote as QuoteIcon, Settings, Users, Wrench, X, HelpCircle,
} from "lucide-react";
import { api } from "@/api/client";
import { useAuthStore } from "@/contexts/authStore";
import Seo from "@/components/Seo";
import ErrorBoundary from "@/components/ErrorBoundary";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/enquiries", label: "Enquiries", icon: FileText },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/services", label: "Services", icon: Wrench },
  { to: "/admin/appointments", label: "Appointments", icon: Calendar },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/testimonials", label: "Testimonials", icon: QuoteIcon },
  { to: "/admin/blog", label: "Blog", icon: Newspaper },
  { to: "/admin/gallery", label: "Gallery", icon: Image },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { to: "/admin/messages", label: "Contact Messages", icon: MessageSquare },
  { to: "/admin/users", label: "Staff & Roles", icon: Users },
  { to: "/admin/settings", label: "Website Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get("/notifications/unread-count").then((r) => setUnread(r.data.count)).catch(() => null);
  }, [location.pathname]);

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const crumbs = location.pathname.split("/").filter(Boolean);

  return (
    <div className="min-h-screen bg-sand-50 flex">
      <Seo title="Studio Admin" noIndex />
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-60 bg-charcoal-950 text-sand-200 z-40 overflow-y-auto transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 flex items-center justify-between sticky top-0 bg-charcoal-950">
          <Link to="/admin" className="font-display text-lg text-sand-50">Aetherlume</Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="px-2.5 pb-24 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-[13px] rounded transition-colors ${
                  isActive ? "bg-sand-50/10 text-sand-50" : "hover:bg-sand-50/5"
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sticky bottom-0 bg-charcoal-950 p-4 border-t border-sand-100/10">
          <p className="text-xs text-sand-300/60 px-2 mb-1">{user?.full_name}</p>
          <p className="text-[10px] text-sand-300/40 px-2 mb-2">{user?.role || "Staff"}</p>
          <button
            onClick={() => { logout(); navigate("/admin/login"); }}
            className="flex items-center gap-3 px-2 py-2 text-[13px] w-full hover:bg-sand-50/5 rounded transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-charcoal-950/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 min-w-0">
        <header className="h-14 border-b border-charcoal-900/10 flex items-center justify-between px-6 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <nav className="text-xs text-charcoal-700/60 flex gap-2">
              {crumbs.map((c, i) => (
                <span key={i} className="capitalize">
                  {i > 0 && <span className="mr-2">/</span>}
                  {c.length > 20 ? "detail" : c}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin/notifications" className="relative" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-clay-500 text-sand-50 text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Link>
            <Link to="/" className="text-xs text-charcoal-700/70 hover:text-charcoal-900">View Site →</Link>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 lg:p-8"
        >
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </motion.main>
      </div>
    </div>
  );
}
