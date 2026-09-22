import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { api } from "@/api/client";
import { Project, Paginated } from "@/types";
import Seo from "@/components/Seo";
import { fallbackInteriorImage } from "@/utils/images";

const CATEGORIES = [
  "ALL", "RESIDENTIAL", "APARTMENT", "VILLA", "KITCHEN", "BEDROOM",
  "LIVING_ROOM", "OFFICE", "COMMERCIAL", "RETAIL", "EXTERIOR",
];

function label(cat: string) {
  return cat === "ALL" ? "All" : cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = { page, page_size: 9 };
    if (category !== "ALL") params.category = category;
    if (search.trim()) params.search = search.trim();

    const timeout = setTimeout(() => {
      api
        .get<Paginated<Project>>("/projects", { params })
        .then((r) => {
          setProjects(r.data.items);
          setTotalPages(r.data.total_pages || 1);
        })
        .finally(() => setLoading(false));
    }, search ? 350 : 0);

    return () => clearTimeout(timeout);
  }, [category, search, page]);

  useEffect(() => setPage(1), [category, search]);

  return (
    <div className="pt-32 pb-24 container-lux">
      <Seo
        title="Projects"
        description="Completed interior design projects across apartments, villas, offices and retail spaces."
      />
      <div className="max-w-2xl mb-12">
        <p className="section-label mb-4">Portfolio</p>
        <h1 className="font-display text-5xl">Projects</h1>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 text-xs tracking-wide transition-all duration-300 ${
                category === cat
                  ? "bg-charcoal-900 text-sand-50"
                  : "border border-charcoal-900/15 text-charcoal-700 hover:border-charcoal-900/40"
              }`}
            >
              {label(cat)}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-700/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects"
            className="w-full pl-9 pr-4 py-2.5 bg-sand-100/60 text-sm outline-none focus:ring-1 focus:ring-clay-500 transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-sand-100 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-2xl mb-2">No projects found</p>
          <p className="text-sm text-charcoal-700/70">Try a different category or search term.</p>
        </div>
      ) : (
        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link to={`/projects/${project.slug}`} className="group block relative overflow-hidden h-80">
                  <img
                    src={project.cover_image_url || fallbackInteriorImage(i)}
                    alt={project.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 p-6 text-sand-50">
                    <p className="text-[10px] uppercase tracking-widest2 text-sand-200/80 mb-1">
                      {label(project.category)}
                    </p>
                    <h3 className="font-display text-xl">{project.name}</h3>
                    <p className="text-xs text-sand-200/70">{project.location}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-14">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 text-sm transition ${
                page === i + 1 ? "bg-charcoal-900 text-sand-50" : "border border-charcoal-900/15"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
