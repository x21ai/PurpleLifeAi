// Each marketing page gets its own unique imagery — no shared photos across pages.
// If you need a new slot, generate a new asset rather than reusing another page's image.

// Home (/)
import homeHero from "@/assets/sign-in-hero.jpg"; // existing mountain/cloud hero — kept for the home page
import homeMugWindow from "@/assets/moment-home-mug-window.jpg";
import homeNightstandNotebook from "@/assets/moment-home-nightstand-notebook.jpg";
import homeShoulderHand from "@/assets/moment-home-shoulder-hand.jpg";

// Features (/features)
import featuresHero from "@/assets/hero-features-misty-valley.jpg";
import featuresPhoneTyping from "@/assets/moment-features-phone-typing.jpg";
import featuresPillOrganizer from "@/assets/moment-features-pill-organizer.jpg";
import featuresHandOnShoulder from "@/assets/moment-features-hand-on-shoulder.jpg";

// Pricing (/pricing)
import pricingHero from "@/assets/hero-pricing-coastal-fog.jpg";
import pricingPillTray from "@/assets/moment-pricing-pill-tray-window.jpg";

// About (/about)
import aboutHero from "@/assets/hero-about-quiet-hills.jpg";
import aboutBedsideLamp from "@/assets/moment-about-bedside-lamp.jpg";
import aboutArmAround from "@/assets/moment-about-arm-around.jpg";

// Community (/community)
import communityHero from "@/assets/hero-community-river-bend.jpg";
import communityWalkingPath from "@/assets/moment-community-walking-path.jpg";

// Contact (/contact)
import contactHero from "@/assets/hero-contact-lake-stillness.jpg";
import contactHandwrittenNote from "@/assets/moment-contact-handwritten-note.jpg";

// Sign-in (/sign-in)
import signInHero from "@/assets/hero-signin-night-coast.jpg";

export const homeImages = {
  hero: homeHero,
  mugWindow: homeMugWindow,
  nightstandNotebook: homeNightstandNotebook,
  shoulderHand: homeShoulderHand,
} as const;

export const featuresImages = {
  hero: featuresHero,
  phoneTyping: featuresPhoneTyping,
  pillOrganizer: featuresPillOrganizer,
  handOnShoulder: featuresHandOnShoulder,
} as const;

export const pricingImages = {
  hero: pricingHero,
  pillTray: pricingPillTray,
} as const;

export const aboutImages = {
  hero: aboutHero,
  bedsideLamp: aboutBedsideLamp,
  armAround: aboutArmAround,
} as const;

export const communityImages = {
  hero: communityHero,
  walkingPath: communityWalkingPath,
} as const;

export const contactImages = {
  hero: contactHero,
  handwrittenNote: contactHandwrittenNote,
} as const;

export const signInImages = {
  hero: signInHero,
} as const;