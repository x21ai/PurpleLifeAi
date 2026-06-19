import { asset } from "./_asset";

import communityHero from "@/assets/hero-community-river-bend.jpg?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture";
import communityWalkingPath from "@/assets/moment-community-walking-path.jpg?w=480;768;1024;1280&format=avif;webp;jpg&as=picture";

export const communityImages = {
  hero: asset(communityHero, "A slow river curving through autumn grasses at golden hour, mountains on the horizon."),
  walkingPath: asset(communityWalkingPath, "A person walking down a grass path at golden hour, tall meadow grass on either side."),
} as const;
