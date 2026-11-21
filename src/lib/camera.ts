// Camera hosts serve the current still at a fixed URL, so a browser will reuse
// the frame it cached on the last visit. Bucket a cache-buster to the page's
// revalidate window: fresh on every regeneration, stable within one.
export function withCacheBust(url: string, revalidateSec: number): string {
  const bucket = Math.floor(Date.now() / (revalidateSec * 1000));
  return `${url}${url.includes("?") ? "&" : "?"}t=${bucket}`;
}
