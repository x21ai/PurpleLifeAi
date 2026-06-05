import dawn from "@/assets/sign-in-hero.jpg";
import coast from "@/assets/hero-readiness-coast.jpg";
import mist from "@/assets/hero-readiness-mist.jpg";
import dawnAlt from "@/assets/hero-readiness-dawn.jpg";

export const calmImages = {
  dawn,
  dawnAlt,
  coast,
  mist,
} as const;

export type CalmImageKey = keyof typeof calmImages;