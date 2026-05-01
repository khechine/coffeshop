/**
 * Centralized image URL sanitizer.
 *
 * Rules:
 * - data:image/... → keep as-is (base64 inline images)
 * - http://localhost:3001/... → strip host, keep path (/uploads/...)
 * - https://api.coffeeshop.elkassa.com/... → strip host, keep path
 * - /uploads/... → keep as-is (relative path, served by nginx proxy)
 * - uploads/... → prefix with /
 * - null/undefined → null (caller should provide a fallback)
 * - External URLs (https://images.unsplash.com/...) → keep as-is
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Base64 data URLs — pass through unchanged
  if (url.startsWith('data:')) return url;

  // Strip known API hosts to produce a relative path that nginx proxies to the API
  if (url.startsWith('http://localhost:3001')) {
    return url.replace('http://localhost:3001', '') || '/';
  }
  if (url.startsWith('https://api.coffeeshop.elkassa.com')) {
    return url.replace('https://api.coffeeshop.elkassa.com', '') || '/';
  }

  // Already a relative or absolute path
  if (url.startsWith('/')) return url;

  // External URLs (Unsplash, CDN, etc.) — pass through
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  // Bare path like "uploads/file.png" → prefix with /
  return '/' + url;
}
