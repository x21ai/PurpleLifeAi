import { asset } from "./_asset";

import contactHero from "@/assets/hero-contact-lake-stillness.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import contactHandwrittenNote from "@/assets/moment-contact-handwritten-note.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

export const contactImages = {
  hero: asset(contactHero, "An utterly still lake at first light, mirroring the soft pastel sky."),
  handwrittenNote: asset(contactHandwrittenNote, "An open notebook with a handwritten note and a fountain pen resting beside it on a wooden desk."),
} as const;
