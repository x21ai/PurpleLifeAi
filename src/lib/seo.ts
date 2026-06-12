/** Canonical marketing origin. All public SEO URLs use www. */
export const SITE_ORIGIN = "https://www.purplelife.org";

/** Default OG image when a route has no dedicated hero asset. */
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-cover.jpg`;

/** Static OG hero images (served from /public/og). */
export const OG_HERO_IMAGES = {
  home: `${SITE_ORIGIN}/og/home.jpg`,
  about: `${SITE_ORIGIN}/og/about.jpg`,
  features: `${SITE_ORIGIN}/og/features.jpg`,
  pricing: `${SITE_ORIGIN}/og/pricing.jpg`,
  trust: `${SITE_ORIGIN}/og/trust.jpg`,
  contact: `${SITE_ORIGIN}/og/contact.jpg`,
  community: `${SITE_ORIGIN}/og/community.jpg`,
} as const;

/** Indexable marketing paths included in sitemap.xml. */
export const SITEMAP_PATHS: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/features", changefreq: "monthly", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.7" },
  { path: "/trust", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "yearly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.5" },
  { path: "/charter", changefreq: "yearly", priority: "0.6" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
  { path: "/community", changefreq: "daily", priority: "0.7" },
  { path: "/community/resources", changefreq: "weekly", priority: "0.6" },
];

type HeadMeta =
  | { title: string; name?: never; property?: never; content?: never }
  | { title?: never; name?: string; property?: string; content: string };
type HeadLink = { rel: string; href: string };
type HeadScript = { type: string; children: string };

export function canonicalUrl(path: string): string {
  const normalized = path.replace(/\/+$/, "") || "/";
  if (normalized === "/") return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

export function absoluteOgImage(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${rel}`;
}

export type MarketingHeadOptions = {
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export function marketingHead({
  path,
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = "Purple, a quiet companion for your health",
  noindex = false,
  jsonLd,
}: MarketingHeadOptions): {
  meta: HeadMeta[];
  links: HeadLink[];
  scripts?: HeadScript[];
} {
  const canonical = canonicalUrl(path);
  const resolvedOgImage = absoluteOgImage(ogImage);
  const resolvedOgTitle = ogTitle ?? title;
  const resolvedOgDescription = ogDescription ?? description;

  const meta: HeadMeta[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: resolvedOgTitle },
    { property: "og:description", content: resolvedOgDescription },
    { property: "og:url", content: canonical },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Purple" },
    { property: "og:image", content: resolvedOgImage },
    { property: "og:image:width", content: "1216" },
    { property: "og:image:height", content: "640" },
    { property: "og:image:alt", content: ogImageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: resolvedOgTitle },
    { name: "twitter:description", content: resolvedOgDescription },
    { name: "twitter:image", content: resolvedOgImage },
  ];

  if (noindex) {
    meta.push({ name: "robots", content: "noindex,nofollow" });
  }

  const result: {
    meta: HeadMeta[];
    links: HeadLink[];
    scripts?: HeadScript[];
  } = {
    meta,
    links: [{ rel: "canonical", href: canonical }],
  };

  if (jsonLd) {
    result.scripts = [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLd),
      },
    ];
  }

  return result;
}

export function noindexHead(title: string): { meta: HeadMeta[] } {
  return {
    meta: [
      { title },
      { name: "robots", content: "noindex,nofollow" },
    ],
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Purple",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/icon-512.png`,
  };
}

export function webApplicationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Purple",
    url: SITE_ORIGIN,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Private, AI-powered health journal for people living with epilepsy, migraine, diabetes, mental health, and other pattern-driven conditions.",
  };
}

export function homeJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationJsonLd(), webApplicationJsonLd()],
  };
}

export function buildSitemapXml(): string {
  const urls = SITEMAP_PATHS.map(
    ({ path, changefreq, priority }) =>
      `  <url><loc>${canonicalUrl(path)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobotsTxt(): string {
  return `User-agent: *
Allow: /
Disallow: /_app/
Disallow: /api/
Disallow: /sign-in
Disallow: /sign-up
Disallow: /reset-password
Disallow: /oauth/
Disallow: /care/accept
Disallow: /friend/accept
Disallow: /friend/join
Disallow: /share/
Disallow: /unsubscribe

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
}
