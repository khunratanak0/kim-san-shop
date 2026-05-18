export function optimizeCloudinaryUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') return '';
  
  // If it's not a Cloudinary URL, leave it alone
  if (!url.includes('res.cloudinary.com')) return url;

  // If we've already optimized it, don't double-inject
  if (url.includes('f_auto') || url.includes('q_auto')) return url;

  // Inject auto-format and high-quality auto-compression
  return url.replace('/upload/', '/upload/f_auto,q_auto:best/');
}