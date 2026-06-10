// Each marketing page gets its own unique imagery, no shared photos across pages.
// If you need a new slot, generate a new asset rather than reusing another page's image.
//
// Every image goes through vite-imagetools (as=picture) so we ship AVIF + WebP + JPG
// with multiple widths for a real srcset. Each image also carries descriptive alt text
// for accessibility, the alt lives next to the asset, not at the call site, so it's
// hard to forget.

import type { PictureAsset } from "@/components/marketing/responsive-image";

// Multi-width responsive sources. Heroes: 640/960/1280/1600/1920.
// Moments / bands: 480/768/1024/1280. Each width emits AVIF + WebP + JPG
// so the browser picks the smallest acceptable variant.
const HERO = "w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
const MOMENT = "w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

import homeHero from "@/assets/sign-in-hero.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import homeMugWindow from "@/assets/moment-home-mug-window.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";
import homeNightstandNotebook from "@/assets/moment-home-nightstand-notebook.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";
import homeShoulderHand from "@/assets/moment-home-shoulder-hand.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

import featuresHero from "@/assets/hero-features-misty-valley.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import featuresPhoneTyping from "@/assets/moment-features-phone-typing.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";
import featuresPillOrganizer from "@/assets/moment-features-pill-organizer.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";
import featuresHandOnShoulder from "@/assets/moment-features-hand-on-shoulder.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

import pricingHero from "@/assets/hero-pricing-coastal-fog.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import pricingPillTray from "@/assets/moment-pricing-pill-tray-window.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

import aboutHero from "@/assets/hero-about-quiet-hills.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import aboutBedsideLamp from "@/assets/moment-about-bedside-lamp.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";
import aboutArmAround from "@/assets/moment-about-arm-around.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

import communityHero from "@/assets/hero-community-river-bend.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import communityWalkingPath from "@/assets/moment-community-walking-path.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

import contactHero from "@/assets/hero-contact-lake-stillness.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import contactHandwrittenNote from "@/assets/moment-contact-handwritten-note.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

import signInHero from "@/assets/hero-signin-night-coast.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
void HERO; void MOMENT;

const asset = (picture: PictureAsset["picture"], alt: string): PictureAsset => ({ picture, alt });

export const homeImages = {
  hero: asset(homeHero, "Soft mountain ridge under a violet dawn sky, mist settling in the valley below."),
  mugWindow: asset(homeMugWindow, "Two hands cradling a warm ceramic mug at a sunlit kitchen window in early morning light."),
  nightstandNotebook: asset(homeNightstandNotebook, "A small notebook and pen resting on a wooden nightstand beside a low lamp, late evening."),
  shoulderHand: asset(homeShoulderHand, "A caregiver's hand resting gently on another person's shoulder, soft window light behind."),
} as const;

export const featuresImages = {
  hero: asset(featuresHero, "A wide, misty mountain valley at first light, layers of fog drifting between distant ridges."),
  phoneTyping: asset(featuresPhoneTyping, "Hands typing a quiet thought into a phone on a warm wooden table, evening light."),
  pillOrganizer: asset(featuresPillOrganizer, "A weekly pill organizer beside a glass of water on a wooden surface, late afternoon light."),
  handOnShoulder: asset(featuresHandOnShoulder, "A caregiver's hand resting on a loved one's shoulder, soft natural light from a nearby window."),
} as const;

export const pricingImages = {
  hero: asset(pricingHero, "A calm coastline wrapped in pale fog, the horizon dissolving into the sea."),
  pillTray: asset(pricingPillTray, "An open pill tray on a worn wooden table near a window, soft late-afternoon light spilling across."),
} as const;

export const aboutImages = {
  hero: asset(aboutHero, "Quiet rolling hills at twilight, low purple haze blanketing the distant fields."),
  bedsideLamp: asset(aboutBedsideLamp, "A person seated on the edge of a bed at dusk, holding a phone, lamp glow behind them."),
  armAround: asset(aboutArmAround, "Two people side by side, one arm around the other's shoulders, watching the day end together."),
} as const;

export const communityImages = {
  hero: asset(communityHero, "A slow river curving through autumn grasses at golden hour, mountains on the horizon."),
  walkingPath: asset(communityWalkingPath, "A person walking down a grass path at golden hour, tall meadow grass on either side."),
} as const;

export const contactImages = {
  hero: asset(contactHero, "An utterly still lake at first light, mirroring the soft pastel sky."),
  handwrittenNote: asset(contactHandwrittenNote, "An open notebook with a handwritten note and a fountain pen resting beside it on a wooden desk."),
} as const;

export const signInImages = {
  hero: asset(signInHero, "A dark coastal headland at deep blue dusk, a small offshore rock silhouetted against fading sky and sea."),
} as const;