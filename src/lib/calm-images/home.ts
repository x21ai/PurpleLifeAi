import type { PictureAsset } from "@/components/marketing/responsive-image";

import heroPtr from "@/assets/sign-in-hero.jpg.asset.json";
import mugPtr from "@/assets/moment-home-mug-window.jpg.asset.json";
import nightstandPtr from "@/assets/moment-home-nightstand-notebook.jpg.asset.json";
import shoulderPtr from "@/assets/moment-home-shoulder-hand.jpg.asset.json";

// Home marketing images are served from the Lovable CDN with stable URLs so
// the published site can never reference a missing build-hashed file.
const cdn = (
  ptr: { url: string },
  w: number,
  h: number,
  alt: string,
): PictureAsset => ({
  picture: { sources: {}, img: { src: ptr.url, w, h } },
  alt,
});

export const homeImages = {
  hero: cdn(heroPtr, 1920, 1080, "Soft mountain ridge under a violet dawn sky, mist settling in the valley below."),
  mugWindow: cdn(mugPtr, 1280, 1600, "Two hands cradling a warm ceramic mug at a sunlit kitchen window in early morning light."),
  nightstandNotebook: cdn(nightstandPtr, 1280, 853, "A small notebook and pen resting on a wooden nightstand beside a low lamp, late evening."),
  shoulderHand: cdn(shoulderPtr, 1280, 1600, "A caregiver's hand resting gently on another person's shoulder, soft window light behind."),
} as const;