import { useEffect } from "react";

interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  /** JSON-LD structured data object, injected as application/ld+json */
  schema?: Record<string, any>;
  /** Set true on pages that shouldn't be indexed (dashboard, admin) */
  noIndex?: boolean;
}

const SITE_NAME = "Aetherlume Interiors";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Sets document metadata for the current route. Rendered client-side, so
 * crawlers that execute JS (Google, Bing) will see it. If you need metadata
 * in the initial HTML response for link-preview bots, put this app behind
 * a prerender service or move to SSR.
 */
export default function Seo({ title, description, image, schema, noIndex }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
    const url = window.location.origin + window.location.pathname;

    document.title = fullTitle;

    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:description", description);
    }

    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", fullTitle);

    if (image) {
      upsertMeta("property", "og:image", image);
      upsertMeta("name", "twitter:image", image);
    }

    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    upsertLink("canonical", url);

    // Structured data
    const SCHEMA_ID = "route-schema";
    document.getElementById(SCHEMA_ID)?.remove();
    if (schema) {
      const script = document.createElement("script");
      script.id = SCHEMA_ID;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(SCHEMA_ID)?.remove();
    };
  }, [title, description, image, schema, noIndex]);

  return null;
}

/* ---- Schema builders ---- */

export function organizationSchema(settings: Record<string, any> = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "InteriorDesignBusiness",
    name: settings.company_name || SITE_NAME,
    description:
      "Interior design studio for residential, commercial and turnkey projects.",
    telephone: settings.company_phone,
    email: settings.company_email,
    address: settings.company_address
      ? { "@type": "PostalAddress", streetAddress: settings.company_address }
      : undefined,
    url: window.location.origin,
  };
}

export function serviceSchema(service: { name: string; description?: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    provider: { "@type": "Organization", name: SITE_NAME },
    url: `${window.location.origin}/services/${service.slug}`,
  };
}

export function projectSchema(project: {
  name: string;
  description?: string;
  cover_image_url?: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.name,
    description: project.description,
    image: project.cover_image_url,
    creator: { "@type": "Organization", name: SITE_NAME },
    url: `${window.location.origin}/projects/${project.slug}`,
  };
}

export function articleSchema(post: {
  title: string;
  excerpt?: string;
  featured_image_url?: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image_url,
    publisher: { "@type": "Organization", name: SITE_NAME },
    url: `${window.location.origin}/blog/${post.slug}`,
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${window.location.origin}${item.path}`,
    })),
  };
}
