import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { api } from "@/api/client";

export default function Footer() {
  const [settings, setSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    api.get("/settings", { params: { group: "company" } }).then((r) => setSettings(r.data)).catch(() => null);
  }, []);

  return (
    <footer className="bg-charcoal-950 text-sand-200 pt-20 pb-10">
      <div className="container-lux grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <h3 className="font-display text-2xl text-sand-50 mb-4">Aetherlume</h3>
          <p className="text-sm text-sand-300/80 leading-relaxed max-w-xs">
            A studio for interiors that are considered from concept to handover — residential,
            commercial and turnkey.
          </p>
          <div className="flex gap-4 mt-6">
            <a
              href={settings.social_instagram || "https://instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-clay-500 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        <div>
          <p className="section-label mb-4">Studio</p>
          <ul className="space-y-3 text-sm">
            <li><Link to="/about" className="hover:text-sand-50 transition-colors">About Us</Link></li>
            <li><Link to="/process" className="hover:text-sand-50 transition-colors">Our Process</Link></li>
            <li><Link to="/projects" className="hover:text-sand-50 transition-colors">Projects</Link></li>
            <li><Link to="/blog" className="hover:text-sand-50 transition-colors">Design Journal</Link></li>
            <li><Link to="/faq" className="hover:text-sand-50 transition-colors">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <p className="section-label mb-4">Services</p>
          <ul className="space-y-3 text-sm">
            <li><Link to="/services/residential-interior-design" className="hover:text-sand-50 transition-colors">Residential Interiors</Link></li>
            <li><Link to="/services/modular-kitchen" className="hover:text-sand-50 transition-colors">Modular Kitchen</Link></li>
            <li><Link to="/services/office-interior" className="hover:text-sand-50 transition-colors">Office Interior</Link></li>
            <li><Link to="/services/turnkey-interior" className="hover:text-sand-50 transition-colors">Turnkey Interior</Link></li>
          </ul>
        </div>

        <div>
          <p className="section-label mb-4">Get in Touch</p>
          <ul className="space-y-3 text-sm text-sand-300/80">
            <li className="flex items-center gap-2"><Phone size={15} /> {settings.company_phone || "+91 79000 96886"}</li>
            <li className="flex items-center gap-2"><Mail size={15} /> {settings.company_email || "knafis574@gmail.com"}</li>
            <li className="flex items-center gap-2"><MapPin size={15} /> {settings.company_address || "Kalyan"}</li>
          </ul>
          <Link to="/quote" className="btn-secondary !border-sand-300/30 !text-sand-50 mt-6 text-xs">
            Request a Quote
          </Link>
        </div>
      </div>

      <div className="container-lux mt-16 pt-8 border-t border-sand-100/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-sand-300/60">
        <p>&copy; {new Date().getFullYear()} Aetherlume Interiors. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-sand-50">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-sand-50">Terms & Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
