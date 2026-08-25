// Shared constants + URL derivation for the property brand logo.
// Imported by the settings form, the settings action, the HTML invoice and
// the PDF invoice — so the bucket name and the accepted formats are stated
// in exactly one place.

export const PROPERTY_LOGO_BUCKET = "property-logos";

/** 1 MB. Mirrors the bucket's own `file_size_limit` (0010_property_logo.sql). */
export const LOGO_MAX_BYTES = 1024 * 1024;

/**
 * PNG and JPEG only, and this is not an arbitrary restriction: it's what
 * @react-pdf/renderer's <Image> can actually rasterise. An SVG would render
 * fine on the HTML invoice and silently break the PDF, so the same two types
 * are enforced here, in the server action, and on the bucket itself.
 */
export const LOGO_MIME_TYPES = ["image/png", "image/jpeg"] as const;

export const LOGO_ACCEPT_ATTR = LOGO_MIME_TYPES.join(",");

export function extensionForMime(mime: string): "png" | "jpg" | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return null;
}

/**
 * Public URL for a stored logo path.
 *
 * Built from the env var rather than `supabase.storage.getPublicUrl()` on
 * purpose: this is a pure string (no client instance, no await), so the same
 * function works in a Server Component, a Route Handler and a Client
 * Component alike. The bucket is public (see 0010), so no signing is needed.
 */
export function logoPublicUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${PROPERTY_LOGO_BUCKET}/${logoPath}`;
}
