import { useState } from "react";

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  /** Skip lazy loading for above-the-fold images (hero, first card). */
  priority?: boolean;
  /** Reserves space so the image can't cause layout shift. e.g. "4/3" */
  aspect?: string;
}

/**
 * Wraps <img> with the three things that actually move Core Web Vitals:
 * reserved space (no CLS), native lazy loading below the fold (no wasted
 * bandwidth), and a fade-in that animates opacity only (no layout work).
 */
export default function Image({ src, alt, className = "", priority = false, aspect }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`bg-sand-100 flex items-center justify-center ${className}`}
        style={aspect ? { aspectRatio: aspect } : undefined}
        role="img"
        aria-label={alt}
      >
        <span className="text-xs text-charcoal-700/30">{alt}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-sand-100 ${className}`}
      style={aspect ? { aspectRatio: aspect } : undefined}
    >
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover transition-opacity duration-700 ease-premium ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
