import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type PictureAsset = {
  picture: {
    sources: Record<string, string>;
    img: { src: string; w: number; h: number };
  };
  alt: string;
};

interface ResponsiveImageProps {
  asset: PictureAsset;
  className?: string;
  /** sizes attribute. Defaults to 100vw. */
  sizes?: string;
  /** LCP hint. Default lazy. */
  priority?: boolean;
  style?: CSSProperties;
  /** Override alt for cases where the same asset needs different context. */
  alt?: string;
}

/**
 * ResponsiveImage renders <picture> with avif/webp/jpg sources from
 * vite-imagetools (as=picture). Non-priority images are lazy + async.
 */
export function ResponsiveImage({
  asset,
  className,
  sizes = "100vw",
  priority = false,
  style,
  alt,
}: ResponsiveImageProps) {
  const { picture } = asset;
  return (
    <picture>
      {Object.entries(picture.sources).map(([type, srcSet]) => (
        <source
          key={type}
          type={type}
          srcSet={srcSet}
          sizes={sizes}
        />
      ))}
      <img
        src={picture.img.src}
        width={picture.img.w}
        height={picture.img.h}
        alt={alt ?? asset.alt}
        className={cn(className)}
        style={style}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        {...(priority ? { fetchPriority: "high" as const } : {})}
      />
    </picture>
  );
}