import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/api/client";
import { Service } from "@/types";
import Reveal from "@/components/Reveal";
import Seo from "@/components/Seo";
import { fallbackInteriorImage } from "@/utils/images";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data));
  }, []);

  return (
    <div className="pt-32 pb-24 container-lux">
      <Seo
        title="Services"
        description="Residential, commercial and turnkey interior design services — from a single room to a full fit-out."
      />
      <Reveal className="max-w-2xl mb-16">
        <p className="section-label mb-4">What We Do</p>
        <h1 className="font-display text-5xl">Services</h1>
        <p className="text-charcoal-700 mt-4">
          From a single room to a full turnkey fit-out — every service follows the same
          considered process, tailored to scope.
        </p>
      </Reveal>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, i) => (
          <Reveal key={service.id} delay={i * 0.05}>
            <Link to={`/services/${service.slug}`} className="group block bg-sand-100/60 overflow-hidden">
              <div className="h-52 overflow-hidden">
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
                  Learn more <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
