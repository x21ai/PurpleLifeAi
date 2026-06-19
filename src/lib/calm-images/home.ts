import { asset } from "./_asset";

import homeHero from "@/assets/sign-in-hero.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import homeMugWindow from "@/assets/moment-home-mug-window.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";
import homeNightstandNotebook from "@/assets/moment-home-nightstand-notebook.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";
import homeShoulderHand from "@/assets/moment-home-shoulder-hand.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

export const homeImages = {
  hero: asset(homeHero, "Soft mountain ridge under a violet dawn sky, mist settling in the valley below."),
  mugWindow: asset(homeMugWindow, "Two hands cradling a warm ceramic mug at a sunlit kitchen window in early morning light."),
  nightstandNotebook: asset(homeNightstandNotebook, "A small notebook and pen resting on a wooden nightstand beside a low lamp, late evening."),
  shoulderHand: asset(homeShoulderHand, "A caregiver's hand resting gently on another person's shoulder, soft window light behind."),
} as const;
