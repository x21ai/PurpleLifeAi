import { asset } from "./_asset";

import trustHero from "@/assets/hero-trust-pine-light.jpg?w=640;960;1280;1536&format=avif;webp;jpg&as=picture";

export const trustImages = {
  hero: asset(trustHero, "First light filtering through a quiet pine forest, low mist drifting between the trunks."),
} as const;
