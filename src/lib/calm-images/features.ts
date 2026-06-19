import { asset } from "./_asset";

import featuresHero from "@/assets/hero-features-misty-valley.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import featuresPhoneTyping from "@/assets/moment-features-phone-typing.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";
import featuresPillOrganizer from "@/assets/moment-features-pill-organizer.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";
import featuresHandOnShoulder from "@/assets/moment-features-hand-on-shoulder.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

export const featuresImages = {
  hero: asset(featuresHero, "A wide, misty mountain valley at first light, layers of fog drifting between distant ridges."),
  phoneTyping: asset(featuresPhoneTyping, "Hands typing a quiet thought into a phone on a warm wooden table, evening light."),
  pillOrganizer: asset(featuresPillOrganizer, "A weekly pill organizer beside a glass of water on a wooden surface, late afternoon light."),
  handOnShoulder: asset(featuresHandOnShoulder, "A caregiver's hand resting on a loved one's shoulder, soft natural light from a nearby window."),
} as const;
