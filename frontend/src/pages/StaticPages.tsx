import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { api } from "@/api/client";
import { BlogPost, FAQItem, Testimonial } from "@/types";
import Reveal from "@/components/Reveal";

/* ---------------- About ---------------- */
export function About() {
  return (
    <div className="pt-32 pb-24">
      <div className="container-lux max-w-3xl">
        <p className="section-label mb-4">The Studio</p>
        <h1 className="font-display text-5xl mb-8">About Aetherlume</h1>
        <p className="text-lg text-charcoal-700 leading-relaxed mb-6">
          We are an interior design practice working across residential, commercial and turnkey
          projects. The studio was built on a simple idea: a space should be designed around how
          it will actually be used, not around a style label.
        </p>
        <p className="text-charcoal-700 leading-relaxed mb-6">
          Our team brings together interior designers, 3D visualization artists and project
          managers under one roof. That means the person who draws your kitchen is in the same
          conversation as the person who installs it — fewer handoffs, fewer surprises on site.
        </p>
        <p className="text-charcoal-700 leading-relaxed">
          Every project runs through a documented process, with a client portal where you can
          track milestones, review design proposals, approve them and message your designer
          directly. No chasing updates over WhatsApp.
        </p>
      </div>

      <div className="container-lux grid md:grid-cols-3 gap-6 mt-16">
        {[
          "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop",
        ].map((src, i) => (
          <Reveal key={src} delay={i * 0.1}>
            <img src={src} alt="" loading="lazy" className="w-full h-72 object-cover" />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Process ---------------- */
const PROCESS = [
  ["Consultation", "We meet, visit the site, and understand your brief, budget and timeline."],
  ["Concept", "Mood boards, spatial concepts and an initial material direction."],
  ["Design", "Detailed drawings, elevations and layouts for every space."],
  ["3D Visualization", "Photoreal renders so you see the space before it's built."],
  ["Material Selection", "Finishes, hardware and furniture finalized with you."],
  ["Execution", "On-site work with scheduled quality checkpoints and progress updates."],
  ["Handover", "A completed, cleaned and documented space, with warranties in place."],
];

export function Process() {
  return (
    <div className="pt-32 pb-24 container-lux">
      <div className="max-w-2xl mb-16">
        <p className="section-label mb-4">How We Work</p>
        <h1 className="font-display text-5xl">Our Process</h1>
        <p className="text-charcoal-700 mt-4">
          Seven stages, the same every time — so you always know where your project stands.
        </p>
      </div>

      <div className="space-y-px">
        {PROCESS.map(([title, desc], i) => (
          <Reveal key={title} delay={i * 0.05}>
            <div className="grid md:grid-cols-12 gap-6 py-10 border-t border-charcoal-900/10">
              <p className="md:col-span-2 font-display text-3xl text-clay-500">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="md:col-span-3 font-display text-2xl">{title}</h2>
              <p className="md:col-span-7 text-charcoal-700 leading-relaxed">{desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Gallery ---------------- */
export function Gallery() {
  const [images, setImages] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    api.get("/gallery", { params: category ? { category } : {} }).then((r) => setImages(r.data));
  }, [category]);

  const categories = Array.from(new Set(images.map((i) => i.category).filter(Boolean)));

  return (
    <div className="pt-32 pb-24 container-lux">
      <div className="max-w-2xl mb-12">
        <p className="section-label mb-4">Visual Archive</p>
        <h1 className="font-display text-5xl">Design Gallery</h1>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-2 text-xs ${!category ? "bg-charcoal-900 text-sand-50" : "border border-charcoal-900/15"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 text-xs ${category === c ? "bg-charcoal-900 text-sand-50" : "border border-charcoal-900/15"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {images.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-2xl mb-2">Gallery coming soon</p>
          <p className="text-sm text-charcoal-700/70">
            Images are added from the studio dashboard. In the meantime, browse our{" "}
            <Link to="/projects" className="underline">projects</Link>.
          </p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {images.map((img) => (
            <button key={img.id} onClick={() => setLightbox(img.image_url)} className="block w-full break-inside-avoid">
              <img src={img.image_url} alt={img.caption || ""} loading="lazy" className="w-full hover:opacity-90 transition-opacity" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-charcoal-950/95 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-h-[88vh] max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}

/* ---------------- Testimonials ---------------- */
export function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  useEffect(() => {
    api.get("/testimonials").then((r) => setItems(r.data));
  }, []);

  return (
    <div className="pt-32 pb-24 container-lux">
      <div className="max-w-2xl mb-14">
        <p className="section-label mb-4">Client Words</p>
        <h1 className="font-display text-5xl">Testimonials</h1>
      </div>

      {items.length === 0 ? (
        <p className="text-charcoal-700/70">No testimonials published yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {items.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.06}>
              <div className="bg-sand-100/60 p-8 h-full">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <span key={j} className="text-clay-500">★</span>
                  ))}
                </div>
                <p className="text-charcoal-800 leading-relaxed mb-6">"{t.content}"</p>
                <p className="text-sm font-medium">{t.client_name}</p>
                {t.client_location && <p className="text-xs text-charcoal-700/60">{t.client_location}</p>}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Blog ---------------- */
export function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  useEffect(() => {
    api.get("/blog").then((r) => setPosts(r.data));
  }, []);

  return (
    <div className="pt-32 pb-24 container-lux">
      <div className="max-w-2xl mb-14">
        <p className="section-label mb-4">Writing</p>
        <h1 className="font-display text-5xl">Design Journal</h1>
      </div>

      {posts.length === 0 ? (
        <p className="text-charcoal-700/70">No articles published yet.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.06}>
              <Link to={`/blog/${post.slug}`} className="group block">
                <div className="h-56 overflow-hidden bg-sand-100 mb-5">
                  <img
                    src={post.featured_image_url || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800"}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h2 className="font-display text-xl mb-2">{post.title}</h2>
                <p className="text-sm text-charcoal-700/80 line-clamp-2">{post.excerpt}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/blog/${slug}`).then((r) => setPost(r.data)).catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="pt-40 pb-24 container-lux text-center">
        <h1 className="font-display text-3xl mb-4">Article not found</h1>
        <Link to="/blog" className="btn-secondary">Back to Journal</Link>
      </div>
    );
  }
  if (!post) return <div className="pt-40 pb-24 container-lux">Loading...</div>;

  return (
    <article className="pt-32 pb-24">
      <div className="container-lux max-w-3xl">
        <Link to="/blog" className="text-xs text-clay-600 mb-6 inline-block">← Design Journal</Link>
        <h1 className="font-display text-4xl md:text-5xl mb-8">{post.title}</h1>
        {post.featured_image_url && (
          <img src={post.featured_image_url} alt={post.title} className="w-full h-96 object-cover mb-10" />
        )}
        <div className="text-charcoal-700 leading-relaxed whitespace-pre-line text-lg">{post.content}</div>
      </div>
    </article>
  );
}

/* ---------------- FAQ ---------------- */
export function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    api.get("/faqs").then((r) => setFaqs(r.data));
  }, []);

  return (
    <div className="pt-32 pb-24 container-lux max-w-3xl">
      <p className="section-label mb-4">Questions</p>
      <h1 className="font-display text-5xl mb-12">Frequently Asked</h1>

      {faqs.length === 0 ? (
        <p className="text-charcoal-700/70">No questions published yet.</p>
      ) : (
        <div className="divide-y divide-charcoal-900/10 border-t border-charcoal-900/10">
          {faqs.map((faq) => (
            <div key={faq.id}>
              <button
                onClick={() => setOpen(open === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between py-6 text-left"
              >
                <span className="font-medium pr-6">{faq.question}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-transform duration-300 ${open === faq.id ? "rotate-180" : ""}`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === faq.id ? "auto" : 0, opacity: open === faq.id ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <p className="pb-6 text-charcoal-700 leading-relaxed">{faq.answer}</p>
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Legal ---------------- */
export function Privacy() {
  return (
    <div className="pt-32 pb-24 container-lux max-w-3xl prose-sm">
      <h1 className="font-display text-5xl mb-8">Privacy Policy</h1>
      <div className="space-y-6 text-charcoal-700 leading-relaxed">
        <p>This policy explains what personal information we collect, why we collect it, and how it is handled.</p>
        <h2 className="font-display text-2xl text-charcoal-900">What we collect</h2>
        <p>When you submit an enquiry, book a consultation or create an account, we collect your name, email address, phone number, and the project details you provide. If you upload reference files, those are stored securely and linked only to your enquiry or project.</p>
        <h2 className="font-display text-2xl text-charcoal-900">How we use it</h2>
        <p>Your information is used to respond to your enquiry, prepare quotations, deliver your project and communicate with you about it. We do not sell your information to third parties.</p>
        <h2 className="font-display text-2xl text-charcoal-900">Access and deletion</h2>
        <p>You can view and update your profile from your account dashboard at any time. To request deletion of your account and associated data, contact us using the details on the contact page.</p>
        <h2 className="font-display text-2xl text-charcoal-900">Security</h2>
        <p>Passwords are stored hashed, never in plain text. Project documents are access-controlled so that only you and your assigned project team can retrieve them.</p>
        <p className="text-sm text-charcoal-700/60">This is a template policy. Have it reviewed by a legal professional before publishing.</p>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <div className="pt-32 pb-24 container-lux max-w-3xl">
      <h1 className="font-display text-5xl mb-8">Terms & Conditions</h1>
      <div className="space-y-6 text-charcoal-700 leading-relaxed">
        <h2 className="font-display text-2xl text-charcoal-900">Use of this website</h2>
        <p>By using this website you agree to use it lawfully and not to attempt to access accounts, projects or documents belonging to others.</p>
        <h2 className="font-display text-2xl text-charcoal-900">Quotations</h2>
        <p>Quotations issued through this platform are estimates based on the information provided and remain valid until the stated expiry date. Final costs may vary following a site survey.</p>
        <h2 className="font-display text-2xl text-charcoal-900">Design approvals</h2>
        <p>Design proposals shared through the client portal are versioned. An approval recorded in the portal is treated as written confirmation to proceed with that version.</p>
        <h2 className="font-display text-2xl text-charcoal-900">Intellectual property</h2>
        <p>Drawings, renders and design documents remain the intellectual property of the studio unless otherwise agreed in writing in the project contract.</p>
        <p className="text-sm text-charcoal-700/60">This is a template. Have it reviewed by a legal professional before publishing.</p>
      </div>
    </div>
  );
}

/* ---------------- 404 ---------------- */
export function NotFound() {
  return (
    <div className="pt-40 pb-32 container-lux text-center">
      <p className="font-display text-7xl text-clay-500 mb-4">404</p>
      <h1 className="font-display text-3xl mb-4">Page not found</h1>
      <p className="text-charcoal-700/70 mb-8">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
