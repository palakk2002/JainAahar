const CLOUDINARY_REGEX = /res\.cloudinary\.com/i;
const CLOUDINARY_UPLOAD_SEGMENT_REGEX = /\/upload\/([^/]+)\//i;

/**
 * Appends Cloudinary optimisation transforms to a URL.
 * Safe to call on any URL — non-Cloudinary URLs are returned unchanged.
 */
/**
 * Preset for small thumbnails (subcategory icons, small avatars).
 * Delivers tiny WebP images (~5-10KB) for instant rendering.
 */
export const THUMBNAIL_TRANSFORM = "f_auto,q_auto,w_160,h_160,c_fill,g_auto,dpr_auto";

/**
 * Preset for medium category images.
 */
export const CATEGORY_TRANSFORM = "f_auto,q_auto,w_320,c_fill,g_auto,dpr_auto";

export function applyCloudinaryTransform(url, params = "f_auto,q_auto,w_400,dpr_auto") {
  if (!url) return null;
  if (!CLOUDINARY_REGEX.test(url)) return url;
  const match = url.match(CLOUDINARY_UPLOAD_SEGMENT_REGEX);
  if (!match) return url;

  const segmentAfterUpload = match[1] || "";
  const alreadyHasTransforms =
    segmentAfterUpload.includes(",") ||
    /^[a-z]{1,4}_[^/]+$/i.test(segmentAfterUpload);

  if (alreadyHasTransforms) return url;

  // Insert transform before the segment after `/upload/` (often `v123...`).
  return url.replace(CLOUDINARY_UPLOAD_SEGMENT_REGEX, `/upload/${params}/$1/`);
}

export function isCloudinaryUrl(url) {
  return !!url && CLOUDINARY_REGEX.test(url);
}

export function buildCloudinarySrcSet(
  url,
  entries,
  baseParams = "f_auto,q_auto,c_fill,g_auto",
) {
  if (!isCloudinaryUrl(url) || !Array.isArray(entries) || entries.length === 0)
    return undefined;

  return entries
    .map(({ w, h }) => {
      const params = [
        baseParams,
        typeof w === "number" ? `w_${w}` : null,
        typeof h === "number" ? `h_${h}` : null,
      ]
        .filter(Boolean)
        .join(",");

      const href = applyCloudinaryTransform(url, params) || url;
      const descriptor = typeof w === "number" ? `${w}w` : "";
      return descriptor ? `${href} ${descriptor}` : href;
    })
    .join(", ");
}

export const REAL_CATEGORY_IMAGES = [
  "/category_grains.jpg",
  "/category_vegetables.jpg",
  "/category_dairy_fruits.jpg",
  "/category_babycare.jpg"
];

export const DEFAULT_CATEGORY_IMAGE = "/category_grains.jpg";
export const DEFAULT_PRODUCT_IMAGE = "/category_grains.jpg";

/**
 * Returns a real photo fallback URL based on category/item name or ID
 */
export function getRealCategoryFallback(nameOrId = "") {
  const str = String(nameOrId || "").toLowerCase();
  if (str.includes("veg") || str.includes("fruit") || str.includes("fresh")) {
    return "/category_vegetables.jpg";
  }
  if (str.includes("dairy") || str.includes("milk") || str.includes("bread") || str.includes("bakery") || str.includes("egg")) {
    return "/category_dairy_fruits.jpg";
  }
  if (str.includes("baby") || str.includes("care") || str.includes("personal") || str.includes("beauty")) {
    return "/category_babycare.jpg";
  }
  if (str.includes("atta") || str.includes("rice") || str.includes("dal") || str.includes("grain") || str.includes("pulse")) {
    return "/category_grains.jpg";
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % REAL_CATEGORY_IMAGES.length;
  return REAL_CATEGORY_IMAGES[index];
}

export function handleImageError(event, fallbackUrl = DEFAULT_CATEGORY_IMAGE) {
  if (event?.target && event.target.src !== fallbackUrl) {
    event.target.onerror = null;
    event.target.src = fallbackUrl;
  }
}

