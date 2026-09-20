/**
 * Shared SEO helpers for public marketing routes on www.purplelife.org.
 * App routes under /_app/ should not use these helpers.
 */

export const MARKETING_SITE_ORIGIN = "https://www.purplelife.org";

export const MARKETING_OG_IMAGE = `${MARKETING_SITE_ORIGIN}/og-cover.jpg`;

export type MarketingHeadInput = {
  /** Public path, e.g. `/about` or `/`. */
  path: `/${string}` | "/";
  title: string;
  description: string;
  /** Defaults to `title`. */
  ogTitle?: string;
  /** Defaults to `description`. */
  ogDescription?: string;
  /** Optional JSON-LD object (serialized in head). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function marketingUrl(path: MarketingHeadInput["path"]): string {
  if (path === "/") return `${MARKETING_SITE_ORIGIN}/`;
  return `${MARKETING_SITE_ORIGIN}${path}`;
}

/** TanStack Router `head()` payload for a marketing page. */
export function marketingHead(input: MarketingHeadInput) {
  const url = marketingUrl(input.path);
  const ogTitle = input.ogTitle ?? input.title;
  const ogDescription = input.ogDescription ?? input.description;

  const head: {
    meta: Array<Record<string, string>>;
    links: Array<{ rel: string; href: string }>;
    scripts?: Array<{ type: string; children: string }>;
  } = {
    meta: [
      { title: input.title },
      { name: "description", content: input.description },
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:url", content: url },
      { name: "twitter:title", content: ogTitle },
      { name: "twitter:description", content: ogDescription },
    ],
    links: [{ rel: "canonical", href: url }],
  };

  if (input.jsonLd) {
    head.scripts = [
      {
        type: "application/ld+json",
        children: JSON.stringify(input.jsonLd),
      },
    ];
  }

  return head;
}

/** Organization stub for JSON-LD on marketing pages. */
export function marketingOrganizationJsonLd() {
  return {
    "@type": "Organization" as const,
    name: "Purple",
    url: MARKETING_SITE_ORIGIN,
    logo: `${MARKETING_SITE_ORIGIN}/icon-512.png`,
  };
}
