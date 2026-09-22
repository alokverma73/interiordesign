import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Mail, MapPin, Phone } from "lucide-react";
import { api, getErrorMessage } from "@/api/client";
import Seo from "@/components/Seo";
import Reveal from "@/components/Reveal";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    api.get("/settings", { params: { group: "company" } }).then((r) => setSettings(r.data)).catch(() => null);
  }, []);

  const inputClass = "w-full bg-transparent border-b border-charcoal-900/20 py-3 outline-none focus:border-clay-500 transition-colors";

  async function submit() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Please enter a valid email.";
    if (form.message.trim().length < 10) e.message = "Please tell us a little more.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSending(true);
    setError("");
    try {
      await api.post("/contact", {
        name: form.name, email: form.email, phone: form.phone || null,
        subject: form.subject || null, message: form.message,
      });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pt-32 pb-24 container-lux">
      <Seo title="Contact" description="Get in touch with our interior design studio." />
      <Reveal className="max-w-2xl mb-14">
        <p className="section-label mb-4">Get in Touch</p>
        <h1 className="font-display text-5xl">Contact</h1>
        <p className="text-charcoal-700 mt-4">
          Tell us what you're planning. For a detailed proposal, the quote form gathers
          everything we need up front.
        </p>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-16">
        <div>
          {sent ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-sand-100/60 p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-clay-500/15 flex items-center justify-center mx-auto mb-5">
                <Check className="text-clay-600" size={24} />
              </div>
              <h2 className="font-display text-2xl mb-2">Message sent</h2>
              <p className="text-sm text-charcoal-700/80">We'll reply within one business day.</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Name *</label>
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Email *</label>
                <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Phone</label>
                <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Subject</label>
                <input className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Message *</label>
                <textarea rows={4} className={inputClass} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={submit} disabled={sending} className="btn-primary disabled:opacity-60">
                {sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-sand-100/60 p-8 space-y-5">
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-clay-600 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-widest2 text-charcoal-700/50">Phone</p>
                <p className="text-sm">{settings.company_phone || "+91 79000 96886"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-clay-600 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-widest2 text-charcoal-700/50">Email</p>
                <p className="text-sm">{settings.company_email || "knafis574@gmail.com"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-clay-600 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-widest2 text-charcoal-700/50">Studio</p>
                <p className="text-sm">{settings.company_address || "Kalyan, Maharashtra"}</p>
              </div>
            </div>
          </div>

          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop"
            alt="Studio"
            className="w-full h-64 object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
