import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { api } from "@/api/client";
import Reveal from "@/components/Reveal";
import { Service, Project, Testimonial } from "@/types";
import Seo, { organizationSchema } from "@/components/Seo";
import { fallbackInteriorImage } from "@/utils/images";

const PROCESS_STEPS = [
  { title: "Consultation", desc: "We start by understanding how you actually live and work." },
  { title: "Concept", desc: "Mood boards and spatial concepts grounded in your brief." },
  { title: "Design", desc: "Detailed drawings, material palettes and layouts." },
  { title: "3D Visualization", desc: "Photoreal renders before anything is built." },
  { title: "Material Selection", desc: "Sourced and finalized with you, not for you." },
  { title: "Execution", desc: "On-site delivery with scheduled quality checkpoints." },
  { title: "Handover", desc: "A finished space, documented and warrantied." },
];

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data.slice(0, 6)));
    api.get("/projects", { params: { featured: true, page_size: 4 } }).then((r) => setProjects(r.data.items));
    api.get("/testimonials", { params: { featured_only: true } }).then((r) => setTestimonials(r.data));
    api.get("/settings", { params: { group: "homepage" } }).then((r) => setSettings(r.data));
  }, []);

  useEffect(() => {
    if (testimonials.length < 2) return;
    const id = setInterval(() => setActiveTestimonial((i) => (i + 1) % testimonials.length), 6000);
    return () => clearInterval(id);
  }, [testimonials]);

  return (
    <div>
      <Seo
        title="Aetherlume Interiors — Considered Interior Design"
        description={settings.hero_subtitle || "Interior design studio for residential, commercial and turnkey projects."}
        schema={organizationSchema(settings)}
      />
      {/* HERO */}
      <section className="relative h-screen min-h-[640px] w-full overflow-hidden flex items-end">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2000&auto=format&fit=crop')",
          }}
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/40 to-charcoal-950/20" />

        <div className="container-lux relative z-10 pb-24 md:pb-32">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="section-label !text-sand-200 mb-6"
          >
            Residential &middot; Commercial &middot; Turnkey
          </motion.p>

          <h1 className="font-display text-5xl md:text-7xl text-sand-50 leading-[1.05] max-w-3xl">
            {(settings.hero_headline || "Interiors, considered.").split(" ").map((word: string, i: number) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block mr-3"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-sand-200 mt-6 max-w-xl text-lg"
          >
            {settings.hero_subtitle ||
              "A design studio for homes and workspaces that are built to be lived in, not just photographed."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="flex flex-wrap gap-4 mt-10"
          >
            <Link to="/quote" className="btn-primary">
              Start Your Project <ArrowRight size={16} />
            </Link>
            <Link to="/projects" className="btn-secondary !text-sand-50 !border-sand-100/40 hover:!border-sand-50">
              Explore Our Work
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sand-100/70"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ArrowDown size={20} />
        </motion.div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-charcoal-900/10">
        <div className="container-lux grid grid-cols-3 md:grid-cols-3 gap-6 py-10 text-center">
          {[
            [settings.stat_projects_completed ?? "180", "Projects Delivered"],
            [settings.stat_years_experience ?? "12", "Years of Practice"],
            [settings.stat_cities_served ?? "6", "Cities Served"],
          ].map(([value, label], i) => (
            <Reveal key={label} delay={i * 0.1}>
              <p className="font-display text-4xl text-charcoal-900">{value}+</p>
              <p className="text-xs tracking-widest2 uppercase text-charcoal-700/60 mt-2">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="container-lux py-28 grid md:grid-cols-2 gap-16 items-center">
        <Reveal>
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1400&auto=format&fit=crop"
            alt="Studio interior"
            className="w-full h-[480px] object-cover"
          />
        </Reveal>
        <Reveal delay={0.15}>
          <p className="section-label mb-4">The Studio</p>
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
            Design that respects how a space will actually be used.
          </h2>
          <p className="text-charcoal-700 leading-relaxed mb-8">
            We work across residential, commercial and turnkey interiors — from single rooms to
            full homes and workplaces — bringing the same rigor to a modular kitchen as to a
            180-seat office fit-out. Every project runs through the same process: consultation,
            concept, detailed design, 3D visualization, procurement and execution, with one point
            of contact throughout.
          </p>
          <Link to="/about" className="btn-secondary">
            About Our Studio <ArrowRight size={16} />
          </Link>
        </Reveal>
      </section>

      {/* SERVICES */}
      <section className="bg-sand-100/60 py-28">
        <div className="container-lux">
          <Reveal className="max-w-xl mb-14">
            <p className="section-label mb-4">What We Do</p>
            <h2 className="font-display text-4xl md:text-5xl">Services built around real spaces</h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <Reveal key={service.id} delay={i * 0.08}>
                <Link
                  to={`/services/${service.slug}`}
                  className="group block bg-sand-50 overflow-hidden"
                >
                  <div className="h-56 overflow-hidden">
                    <img
                      src={service.cover_image_url || fallbackInteriorImage(i)}
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl mb-2">{service.name}</h3>
                    <p className="text-sm text-charcoal-700/80 line-clamp-2">{service.short_description}</p>
                    <span className="inline-flex items-center gap-1 text-xs mt-4 text-clay-600 group-hover:gap-2 transition-all">
                      Explore <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="container-lux py-28">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <p className="section-label mb-4">Selected Work</p>
            <h2 className="font-display text-4xl md:text-5xl">Featured Projects</h2>
          </div>
          <Link to="/projects" className="btn-secondary">
            View All Projects <ArrowRight size={16} />
          </Link>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, i) => (
            <Reveal key={project.id} delay={i * 0.1}>
              <Link to={`/projects/${project.slug}`} className="group block relative overflow-hidden h-[420px]">
                <img
                  src={project.cover_image_url || fallbackInteriorImage(i)}
                  alt={project.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 text-sand-50">
                  <p className="text-xs uppercase tracking-widest2 text-sand-200/80 mb-2">{project.category}</p>
                  <h3 className="font-display text-2xl">{project.name}</h3>
                  <p className="text-sm text-sand-200/70">{project.location}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-charcoal-950 text-sand-50 py-28">
        <div className="container-lux">
          <Reveal className="max-w-xl mb-16">
            <p className="section-label mb-4">How We Work</p>
            <h2 className="font-display text-4xl md:text-5xl">Our Process</h2>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-x-8 gap-y-14">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06}>
                <p className="font-display text-3xl text-clay-500 mb-3">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-sand-300/70 leading-relaxed">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="container-lux py-28 text-center max-w-3xl mx-auto">
          <p className="section-label mb-8">Client Words</p>
          <motion.div
            key={activeTestimonial}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-display text-2xl md:text-3xl leading-relaxed">
              "{testimonials[activeTestimonial].content}"
            </p>
            <p className="mt-8 text-sm text-charcoal-700/70">
              {testimonials[activeTestimonial].client_name}
              {testimonials[activeTestimonial].client_location && ` — ${testimonials[activeTestimonial].client_location}`}
            </p>
          </motion.div>
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeTestimonial ? "w-8 bg-clay-600" : "w-1.5 bg-charcoal-900/20"
                }`}
                aria-label={`Show testimonial ${i + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1800&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-charcoal-950/75" />
        <div className="container-lux relative z-10 text-center">
          <Reveal>
            <h2 className="font-display text-4xl md:text-5xl text-sand-50 mb-6">
              Ready to start your project?
            </h2>
            <p className="text-sand-200 mb-10 max-w-xl mx-auto">
              Tell us about your space and timeline — we'll get back to you within one business day.
            </p>
            <Link to="/quote" className="btn-primary">
              Request a Quote <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
