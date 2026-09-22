import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "@/contexts/authStore";

const NAV_LINKS = [
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/process", label: "Process" },
  { to: "/gallery", label: "Gallery" },
  { to: "/blog", label: "Journal" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const isHome = location.pathname === "/";
  const solid = scrolled || !isHome || mobileOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-premium ${
        solid ? "bg-sand-50/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container-lux flex items-center justify-between h-20">
        <Link to="/" className={`font-display text-xl tracking-wide ${solid ? "text-charcoal-900" : "text-sand-50"}`}>
          Aetherlume
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative text-sm tracking-wide py-1 group ${
                  solid ? "text-charcoal-800" : "text-sand-50"
                } ${isActive ? "font-medium" : ""}`
              }
            >
              {link.label}
              <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-clay-500 transition-all duration-300 ease-premium group-hover:w-full" />
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <Link
            to={user ? "/dashboard" : "/login"}
            className={`text-sm ${solid ? "text-charcoal-800" : "text-sand-50"}`}
          >
            {user ? "My Account" : "Sign In"}
          </Link>
          <Link to="/quote" className="btn-primary !py-2.5 !px-5 text-xs">
            Start Your Project
          </Link>
        </div>

        <button
          className={`lg:hidden ${solid ? "text-charcoal-900" : "text-sand-50"}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden bg-sand-50 border-t border-charcoal-900/10 overflow-hidden"
          >
            <div className="container-lux py-6 flex flex-col gap-5">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={link.to} className="text-charcoal-900 text-lg">
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Link to={user ? "/dashboard" : "/login"} className="text-charcoal-900 text-lg">
                {user ? "My Account" : "Sign In"}
              </Link>
              <Link to="/quote" className="btn-primary justify-center mt-2">
                Start Your Project
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
