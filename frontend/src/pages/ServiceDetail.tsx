import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { api } from "@/api/client";
import { Service } from "@/types";
import Reveal from "@/components/Reveal";
import Seo, { serviceSchema } from "@/components/Seo";

export default function ServiceDetail() {
  const { slug } = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get(`/services/${slug}`)
      .then((r) => setService(r.data))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="pt-40 pb-24 container-lux text-center">
        <h1 className="font-display text-3xl mb-4">Service not found</h1>
        <Link to="/services" className="btn-secondary">Back to Services</Link>
      </div>
    );
  }

  if (!service) return <div className="pt-40 pb-24 container-lux">Loading...</div>;

  return (
    <div>
      <Seo
        title={service.seo_title || service.name}
        description={service.seo_description || service.short_description || undefined}
        image={service.cover_image_url || undefined}
        schema={serviceSchema(service)}
      />
      <section className="relative h-[60vh] min-h-[420px] flex items-end">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${service.cover_image_url || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop"}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 to-transparent" />
        <div className="container-lux relative z-10 pb-16 text-sand-50">
          <p className="section-label !text-sand-200 mb-4">Service</p>
          <h1 className="font-display text-5xl">{service.name}</h1>
        </div>
      </section>

      <section className="container-lux py-20 grid md:grid-cols-3 gap-16">
        <div className="md:col-span-2">
          <Reveal>
            <p className="text-lg text-charcoal-700 leading-relaxed">{service.description}</p>
          </Reveal>

          {service.process_steps?.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl mb-8">How this works</h2>
              <div className="space-y-8">
                {service.process_steps.map((step, i) => (
                  <Reveal key={i} delay={i * 0.05} className="flex gap-6">
                    <span className="font-display text-2xl text-clay-500 w-10">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="font-medium mb-1">{step.title}</h3>
                      <p className="text-sm text-charcoal-700/80">{step.description}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {service.faqs?.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl mb-8">Frequently asked</h2>
              <div className="divide-y divide-charcoal-900/10">
                {service.faqs.map((faq, i) => (
                  <div key={i} className="py-5">
                    <p className="font-medium mb-2">{faq.question}</p>
                    <p className="text-sm text-charcoal-700/80">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="bg-sand-100/60 p-8 sticky top-28">
            {service.features?.length > 0 && (
              <ul className="space-y-3 mb-8">
                {service.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="text-clay-600 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            )}
            <Link to="/quote" className="btn-primary w-full justify-center">
              {service.cta_label || "Request a Quote"} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
