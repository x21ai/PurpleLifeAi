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
  // vite-imagetools emits `.jpeg` in the manifest for jpg outputs, but the
  // deployed Cloudflare static-assets host writes JPG files with `.jpg`.
  // The resulting URLs 404 in production. Normalize every srcset URL —
  // safe for avif/webp/jpg because only `.jpeg` is rewritten.
  const rewriteJpeg = (s: string) => s.replace(/\.jpeg(\?[^\s,]*)?/gi, ".jpg$1");
  const fallbackSrc = rewriteJpeg(picture.img.src);
  return (
    <picture>
      {Object.entries(picture.sources).map(([type, srcSet]) => (
        <source
          key={type}
          type={type}
          srcSet={rewriteJpeg(srcSet)}
          sizes={sizes}
        />
      ))}
      <img
        src={fallbackSrc}
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