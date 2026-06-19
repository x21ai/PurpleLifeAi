import { asset } from "./_asset";

import pricingHero from "@/assets/hero-pricing-coastal-fog.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import pricingPillTray from "@/assets/moment-pricing-pill-tray-window.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

export const pricingImages = {
  hero: asset(pricingHero, "A calm coastline wrapped in pale fog, the horizon dissolving into the sea."),
  pillTray: asset(pricingPillTray, "An open pill tray on a worn wooden table near a window, soft late-afternoon light spilling across."),
} as const;
