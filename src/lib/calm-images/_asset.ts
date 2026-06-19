import type { PictureAsset } from "@/components/marketing/responsive-image";

// Shared helper for the per-page marketing image modules. Each marketing route
// imports only its own module so it pulls only its own image graph (the old
// single calm-images.ts statically imported every page's imagery at once).
//
// Multi-width responsive sources used by the per-page imports:
//   Heroes:  w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture
//   Moments: w=480;768;1024;1280&format=avif;webp;jpg&as=picture
export const asset = (picture: PictureAsset["picture"], alt: string): PictureAsset => ({
  picture,
  alt,
});
