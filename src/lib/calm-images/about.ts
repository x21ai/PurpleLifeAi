import { asset } from "./_asset";

import aboutHero from "@/assets/hero-about-quiet-hills.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import aboutBedsideLamp from "@/assets/moment-about-bedside-lamp.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";
import aboutArmAround from "@/assets/moment-about-arm-around.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

export const aboutImages = {
  hero: asset(aboutHero, "Quiet rolling hills at twilight, low purple haze blanketing the distant fields."),
  bedsideLamp: asset(aboutBedsideLamp, "A person seated on the edge of a bed at dusk, holding a phone, lamp glow behind them."),
  armAround: asset(aboutArmAround, "Two people side by side, one arm around the other's shoulders, watching the day end together."),
} as const;
