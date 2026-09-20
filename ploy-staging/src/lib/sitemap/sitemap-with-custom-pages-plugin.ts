import { fileURLToPath } from "node:url";
import sitemap, { type SitemapOptions } from "@astrojs/sitemap";
import type { AstroIntegration } from "astro";
import { SITE_CONFIG } from "../../site-config";
import { getSitemapPaths } from "./get-sitemap-paths";
import { normalizeSourceUrls } from "./shared";

// Ploy patches the `site:` literal at deploy time, so we emit URLs against a
// placeholder and swap it for the resolved `config.site` at sitemap emit time.
const PLACEHOLDER = "https://ploy.invalid";

const PUBLIC_INDEXABLE_PATHS = new Set([
  "/about",
  "/charter",
  "/community",
  "/community/resources",
  "/contact",
  "/features",
  "/how-purple-thinks",
  "/pricing",
  "/privacy",
  "/resources",
  "/terms",
  "/trust",
]);

const normalizePathname = (url: string) => {
  const pathname = new URL(url).pathname.replace(/\/$/, "");
  return pathname || "/";
};

export function sitemapWithCustomPages(
  options: SitemapOptions = {},
): AstroIntegration[] {
  let resolvedSite = "";
  const userSerialize = options.serialize;
  const userFilter = options.filter;
  const paths = getSitemapPaths();
  const contentPaths = new Set(paths.map((path) => path.replace(/\/$/, "") || "/"));

  return [
    {
      name: "capture-site-for-sitemap",
      hooks: {
        // Inject the proxy routes only when an upstream is configured.
        "astro:config:setup": ({ injectRoute }) => {
          if (normalizeSourceUrls(SITE_CONFIG.sourceSitemapUrl).length > 0) {
            injectRoute({
              pattern: "/sitemap.xml",
              entrypoint: fileURLToPath(
                new URL("./sitemap.ts", import.meta.url),
              ),
              prerender: false,
            });
            injectRoute({
              pattern: "/proxied-sitemap-[i].xml",
              entrypoint: fileURLToPath(
                new URL("./proxy-sitemap.ts", import.meta.url),
              ),
              prerender: false,
            });
          }
        },
        "astro:config:done": ({ config }) => {
          if (config.site) {
            resolvedSite = String(config.site).replace(/\/$/, "");
          }
        },
      },
    },
    sitemap({
      ...options,
      customPages: [
        ...paths.map((p) => `${PLACEHOLDER}${p.startsWith("/") ? p : `/${p}`}`),
        ...(options.customPages ?? []),
      ],
      filter(page) {
        const pathname = normalizePathname(page);
        const isIndexable =
          PUBLIC_INDEXABLE_PATHS.has(pathname) || contentPaths.has(pathname);
        return isIndexable && (userFilter ? userFilter(page) : true);
      },
      serialize(item) {
        if (resolvedSite && item.url.startsWith(PLACEHOLDER)) {
          item.url = resolvedSite + item.url.slice(PLACEHOLDER.length);
        }
        return userSerialize ? userSerialize(item) : item;
      },
    }),
  ];
}
