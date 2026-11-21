// The site's public address. Netlify sets URL at build time to the site's
// primary address (its custom domain if one is added, else <name>.netlify.app),
// so renaming the site or adding a domain needs no code change. The fallback
// covers local builds.
export const SITE_URL = process.env.URL || "https://gasrun.netlify.app";
export const SITE_HOST = new URL(SITE_URL).host;
