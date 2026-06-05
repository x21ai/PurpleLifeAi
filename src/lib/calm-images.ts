import dawn from "@/assets/sign-in-hero.jpg";
import coast from "@/assets/hero-readiness-coast.jpg";
import mist from "@/assets/hero-readiness-mist.jpg";
import dawnAlt from "@/assets/hero-readiness-dawn.jpg";
import mugMorning from "@/assets/human-mug-morning.jpg";
import bedsideDusk from "@/assets/human-bedside-dusk.jpg";
import caregiverHand from "@/assets/human-caregiver-hand.jpg";
import walkGrass from "@/assets/human-walk-grass.jpg";
import pillOrganizer from "@/assets/still-pill-organizer.jpg";
import nightstand from "@/assets/still-nightstand.jpg";

export const calmImages = {
  dawn,
  dawnAlt,
  coast,
  mist,
} as const;

export type CalmImageKey = keyof typeof calmImages;

export const humanImages = {
  mugMorning,
  bedsideDusk,
  caregiverHand,
  walkGrass,
  pillOrganizer,
  nightstand,
} as const;

export type HumanImageKey = keyof typeof humanImages;