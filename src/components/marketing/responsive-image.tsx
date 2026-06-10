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
  // deployed Cloudflare static-assets host writes the file as `.jpg`. The
  // resulting <img> fallback 404s on any browser that skips AVIF/WebP. Rewrite
  // the extension here so the fallback resolves on both hosts.
  const fallbackSrc = picture.img.src.replace(/\.jpeg(\?|$)/i, ".jpg$1");
  // Also normalize any .jpeg URLs inside srcSet entries (e.g. the image/jpeg
  // source). Each srcSet is "url 1x, url 2x" — rewrite extensions in place.
  const rewriteSrcSet = (srcSet: string) =>
    srcSet.replace(/\.jpeg(\?[^\s,]*)?/gi, ".jpg$1");
  return (
    <picture>
      {Object.entries(picture.sources).map(([type, srcSet]) => (
        <source
          key={type}
          type={type}
          srcSet={type === "image/jpeg" ? rewriteSrcSet(srcSet) : srcSet}
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