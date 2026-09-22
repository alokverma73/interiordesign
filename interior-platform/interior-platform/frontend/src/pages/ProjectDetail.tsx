import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/api/client";
import { Project } from "@/types";
import Reveal from "@/components/Reveal";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import Seo, { projectSchema } from "@/components/Seo";

export default function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [related, setRelated] = useState<Project[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setProject(null);
    api.get(`/projects/${slug}`).then((r) => setProject(r.data)).catch(() => setNotFound(true));
    api.get(`/projects/${slug}/related`).then((r) => setRelated(r.data)).catch(() => setRelated([]));
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightboxIndex === null || !project) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => ((i ?? 0) + 1) % project.gallery.length);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => ((i ?? 0) - 1 + project.gallery.length) % project.gallery.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, project]);

  if (notFound) {
    return (
      <div className="pt-40 pb-24 container-lux text-center">
        <h1 className="font-display text-3xl mb-4">Project not found</h1>
        <Link to="/projects" className="btn-secondary">Back to Projects</Link>
      </div>
    );
  }

  if (!project) return <div className="pt-40 pb-24 container-lux">Loading...</div>;

  return (
    <div>
      <Seo
        title={project.seo_title || project.name}
        description={project.seo_description || project.description || undefined}
        image={project.cover_image_url || undefined}
        schema={projectSchema(project)}
      />
      <section className="relative h-[70vh] min-h-[480px] flex items-end overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${project.cover_image_url || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1800&auto=format&fit=crop"}')` }}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 6, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 to-transparent" />
        <div className="container-lux relative z-10 pb-16 text-sand-50">
          <p className="section-label !text-sand-200 mb-4">{project.category.replace(/_/g, " ")}</p>
          <h1 className="font-display text-5xl md:text-6xl max-w-3xl">{project.name}</h1>
          <p className="text-sand-200/80 mt-3">{project.location}</p>
        </div>
      </section>

      <section className="container-lux py-20 grid md:grid-cols-3 gap-16">
        <div className="md:col-span-2 space-y-10">
          <Reveal>
            <h2 className="font-display text-2xl mb-4">Overview</h2>
            <p className="text-charcoal-700 leading-relaxed">{project.description}</p>
          </Reveal>
          {project.design_concept && (
            <Reveal>
              <h2 className="font-display text-2xl mb-4">Design Concept</h2>
              <p className="text-charcoal-700 leading-relaxed">{project.design_concept}</p>
            </Reveal>
          )}
          {project.materials_used?.length > 0 && (
            <Reveal>
              <h2 className="font-display text-2xl mb-4">Materials</h2>
              <div className="flex flex-wrap gap-2">
                {project.materials_used.map((m) => (
                  <span key={m} className="px-3 py-1.5 bg-sand-100 text-xs">{m}</span>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        <aside>
          <div className="bg-sand-100/60 p-8 space-y-5 sticky top-28">
            {[
              ["Category", project.category.replace(/_/g, " ")],
              ["Location", project.location],
              ["Client Type", project.client_type],
              ["Area", project.area_sqft ? `${project.area_sqft} sq ft` : null],
              ["Completed", project.completion_date],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k as string}>
                  <p className="text-[10px] uppercase tracking-widest2 text-charcoal-700/50">{k}</p>
                  <p className="text-sm mt-1">{v}</p>
                </div>
              ))}
            <Link to="/quote" className="btn-primary w-full justify-center !mt-8">
              Start a Similar Project <ArrowRight size={15} />
            </Link>
          </div>
        </aside>
      </section>

      {project.gallery?.length > 0 && (
        <section className="container-lux pb-20">
          <h2 className="font-display text-2xl mb-8">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {project.gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="group relative overflow-hidden h-64 w-full"
              >
                <img
                  src={img}
                  alt={`${project.name} — view ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {project.before_after_images?.length > 0 && (
        <section className="container-lux pb-20">
          <h2 className="font-display text-2xl mb-8">Before & After</h2>
          <div className="space-y-10">
            {project.before_after_images.map((pair, i) => (
              <BeforeAfterSlider key={i} before={pair.before} after={pair.after} label={pair.label} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="bg-sand-100/60 py-20">
          <div className="container-lux">
            <h2 className="font-display text-2xl mb-8">Related Projects</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map((p) => (
                <Link key={p.id} to={`/projects/${p.slug}`} className="group block relative overflow-hidden h-64">
                  <img
                    src={p.cover_image_url || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800"}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 to-transparent" />
                  <div className="absolute bottom-0 p-5 text-sand-50">
                    <h3 className="font-display text-lg">{p.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && project.gallery?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-charcoal-950/95 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button className="absolute top-6 right-6 text-sand-50" aria-label="Close">
              <X size={28} />
            </button>
            <button
              className="absolute left-6 text-sand-50"
              aria-label="Previous"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => ((i ?? 0) - 1 + project.gallery.length) % project.gallery.length);
              }}
            >
              <ChevronLeft size={36} />
            </button>
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              src={project.gallery[lightboxIndex]}
              alt=""
              className="max-h-[85vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute right-6 text-sand-50"
              aria-label="Next"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => ((i ?? 0) + 1) % project.gallery.length);
              }}
            >
              <ChevronRight size={36} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
