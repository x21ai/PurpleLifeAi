interface SiteConfig {
  name: string;
  description: string;
  // URL(s) of an existing sitemap to mirror at /sitemap.xml with hosts
  // rewritten to this site's domain. Empty to disable.
  sourceSitemapUrl: string | string[];
}

// TODO: Replace `name` and `description` with the client's own. These drive
// <title>, the meta description, Open Graph tags, and llms.txt — leaving them
// empty ships a site with a blank title.
export const SITE_CONFIG: SiteConfig = {
  name: "PurpleLife",
  description:
    "PurpleLife is a quiet health journaling companion for capturing symptoms, medication, sleep, photos, and notes.",
  sourceSitemapUrl: "",
};
