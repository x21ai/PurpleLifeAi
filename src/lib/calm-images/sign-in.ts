import { asset } from "./_asset";

import signInHero from "@/assets/hero-signin-night-coast.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";

export const signInImages = {
  hero: asset(signInHero, "A dark coastal headland at deep blue dusk, a small offshore rock silhouetted against fading sky and sea."),
} as const;
