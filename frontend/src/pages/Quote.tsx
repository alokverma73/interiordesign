import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { api, getErrorMessage } from "@/api/client";
import Seo from "@/components/Seo";
import { Service } from "@/types";

interface FormData {
  name: string; email: string; phone: string; city: string;
  property_type: string; size_bhk: string; area_sqft: string;
  service_id: string; budget_range: string; preferred_style: string;
  expected_start_date: string; description: string; preferred_contact_method: string;
}

const EMPTY: FormData = {
  name: "", email: "", phone: "", city: "", property_type: "", size_bhk: "",
  area_sqft: "", service_id: "", budget_range: "NOT_SURE", preferred_style: "",
  expected_start_date: "", description: "", preferred_contact_method: "EMAIL",
};

const BUDGETS = [
  ["UNDER_5L", "Under ₹5 Lakh"], ["5L_10L", "₹5–10 Lakh"], ["10L_25L", "₹10–25 Lakh"],
  ["25L_50L", "₹25–50 Lakh"], ["ABOVE_50L", "Above ₹50 Lakh"], ["NOT_SURE", "Not sure yet"],
];

const STEPS = ["Your Details", "Your Space", "Project Brief", "Review"];

export default function Quote() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [files, setFiles] = useState<{ storage_key: string; file_name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [enquiryNumber, setEnquiryNumber] = useState("");

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data)).catch(() => setServices([]));
  }, []);

  const set = (key: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  function validateStep(current: number): boolean {
    const e: Record<string, string> = {};
    if (current === 0) {
      if (form.name.trim().length < 2) e.name = "Please enter your name.";
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Please enter a valid email.";
      if (form.phone.trim().length < 7) e.phone = "Please enter a valid phone number.";
    }
    if (current === 1) {
      if (!form.property_type) e.property_type = "Please select a property type.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleFileUpload(fileList: FileList | null) {
    if (!fileList) return;
    for (const file of Array.from(fileList).slice(0, 5)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const { data } = await api.post("/uploads/public", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setFiles((prev) => [...prev, data]);
      } catch (err) {
        setSubmitError(getErrorMessage(err));
      }
    }
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload: Record<string, any> = {
        name: form.name, email: form.email, phone: form.phone, city: form.city || null,
        property_type: form.property_type || null, size_bhk: form.size_bhk || null,
        area_sqft: form.area_sqft ? Number(form.area_sqft) : null,
        service_id: form.service_id || null, budget_range: form.budget_range,
        preferred_style: form.preferred_style || null,
        expected_start_date: form.expected_start_date || null,
        description: form.description || null,
        reference_files: files.map((f) => f.storage_key),
        preferred_contact_method: form.preferred_contact_method,
      };
      const { data } = await api.post("/quote", payload);
      setEnquiryNumber(data.enquiry_number);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (enquiryNumber) {
    return (
      <div className="pt-40 pb-32 container-lux text-center max-w-xl mx-auto">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-16 h-16 rounded-full bg-clay-500/15 flex items-center justify-center mx-auto mb-6">
            <Check className="text-clay-600" size={28} />
          </div>
          <h1 className="font-display text-3xl mb-4">Enquiry received</h1>
          <p className="text-charcoal-700 mb-6">
            Thank you. Your enquiry reference is below — keep it to track your enquiry status.
            We'll be in touch within one business day.
          </p>
          <p className="font-display text-2xl tracking-wide bg-sand-100 py-4 mb-8">{enquiryNumber}</p>
          <a href="/" className="btn-secondary">Back to Home</a>
        </motion.div>
      </div>
    );
  }

  const inputClass = "w-full bg-transparent border-b border-charcoal-900/20 py-3 outline-none focus:border-clay-500 transition-colors";

  return (
    <div className="pt-32 pb-24 container-lux max-w-3xl">
      <Seo title="Request a Quote" description="Tell us about your space and get a tailored interior design proposal." />
      <p className="section-label mb-4">Request a Quote</p>
      <h1 className="font-display text-4xl md:text-5xl mb-10">Tell us about your project</h1>

      <div className="flex gap-2 mb-12">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-0.5 transition-colors duration-500 ${i <= step ? "bg-clay-500" : "bg-charcoal-900/15"}`} />
            <p className={`text-[10px] uppercase tracking-widest2 mt-2 ${i <= step ? "text-clay-600" : "text-charcoal-700/40"}`}>
              {s}
            </p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          {step === 0 && (
            <>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Full Name *</label>
                <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Email *</label>
                <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Phone *</label>
                <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">City</label>
                <input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Preferred Contact</label>
                <select className={inputClass} value={form.preferred_contact_method} onChange={(e) => set("preferred_contact_method", e.target.value)}>
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Phone</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Property Type *</label>
                <select className={inputClass} value={form.property_type} onChange={(e) => set("property_type", e.target.value)}>
                  <option value="">Select</option>
                  <option>Apartment</option><option>Villa</option><option>Independent House</option>
                  <option>Office</option><option>Retail Space</option><option>Other</option>
                </select>
                {errors.property_type && <p className="text-xs text-red-600 mt-1">{errors.property_type}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Size / BHK</label>
                <input className={inputClass} placeholder="e.g. 3BHK" value={form.size_bhk} onChange={(e) => set("size_bhk", e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Carpet Area (sq ft)</label>
                <input type="number" className={inputClass} value={form.area_sqft} onChange={(e) => set("area_sqft", e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Service Required</label>
                <select className={inputClass} value={form.service_id} onChange={(e) => set("service_id", e.target.value)}>
                  <option value="">Select a service</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Budget Range</label>
                <select className={inputClass} value={form.budget_range} onChange={(e) => set("budget_range", e.target.value)}>
                  {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Preferred Style</label>
                <input className={inputClass} placeholder="e.g. Warm minimal, Contemporary" value={form.preferred_style} onChange={(e) => set("preferred_style", e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Expected Start Date</label>
                <input type="date" className={inputClass} value={form.expected_start_date} onChange={(e) => set("expected_start_date", e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Tell us more</label>
                <textarea rows={4} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Reference Images / Documents</label>
                <input type="file" multiple onChange={(e) => handleFileUpload(e.target.files)} className="mt-3 text-sm" />
                {files.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {files.map((f) => <li key={f.storage_key} className="text-xs text-charcoal-700/70">✓ {f.file_name}</li>)}
                  </ul>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <div className="bg-sand-100/60 p-8 space-y-4">
              {[
                ["Name", form.name], ["Email", form.email], ["Phone", form.phone], ["City", form.city],
                ["Property", form.property_type], ["Size", form.size_bhk],
                ["Area", form.area_sqft && `${form.area_sqft} sq ft`],
                ["Budget", BUDGETS.find(([v]) => v === form.budget_range)?.[1]],
                ["Style", form.preferred_style], ["Start Date", form.expected_start_date],
                ["Files", files.length ? `${files.length} attached` : ""],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} className="flex justify-between text-sm border-b border-charcoal-900/10 pb-2">
                  <span className="text-charcoal-700/60">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              {form.description && <p className="text-sm text-charcoal-700 pt-2">{form.description}</p>}
              {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-12">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button onClick={() => validateStep(step) && setStep((s) => s + 1)} className="btn-primary">
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={submit} disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit Enquiry"} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
