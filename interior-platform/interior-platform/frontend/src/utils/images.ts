/**
 * source.unsplash.com (the old "random image" redirect service) was
 * discontinued, which is why fallback images broke. This is a small pool of
 * real, working direct Unsplash image links used only when a service/project
 * doesn't have its own cover_image_url set from the admin panel yet.
 *
 * Replace these with your own project photos via the admin panel — this
 * pool is just so the site never shows a broken image.
 */
export const FALLBACK_INTERIOR_IMAGES = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1615874959474-d609969a20ed?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=800&auto=format&fit=crop",
];

export function fallbackInteriorImage(index: number): string {
  const pool = FALLBACK_INTERIOR_IMAGES;
  return pool[((index % pool.length) + pool.length) % pool.length];
}
