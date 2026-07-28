"use client";
import Image from "next/image";
import { useState } from "react";

/**
 * A thumbnail backed by next/image that fills its (relatively-positioned)
 * parent. Provides a world-class loading experience:
 *   - native lazy-loading + reserved space (zero layout shift)
 *   - blur-up (LQIP): when `lqipSrc` is given, a tiny blurred preview shows
 *     instantly underneath, and the full image lands seamlessly on top once
 *     decoded — no fade/flash, it just clarifies
 *   - an animated shimmer skeleton as the fallback when no LQIP is available
 *   - a graceful fallback when the source fails
 *
 * Uses `unoptimized` because sources here are heterogeneous and not
 * optimizer-friendly: data: URLs, cookie-gated /storage paths, and arbitrary
 * remote template URLs whose domains aren't whitelisted in next.config. The
 * browser fetches them directly; we keep the layout/lazy/fade benefits.
 *
 * The parent element MUST be `position: relative` (e.g. has the `relative`
 * class) so `fill` can anchor to it.
 */
export function FadeImage({
  src,
  alt,
  className = "",
  sizes = "200px",
  lqipSrc,
  draggable = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  /** Optional tiny blurred placeholder URL for the blur-up effect. */
  lqipSrc?: string;
  draggable?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <>
      {!loaded && (
        <span aria-hidden className="absolute inset-0 overflow-hidden bg-bg-3">
          {failed ? null : lqipSrc ? (
            // Tiny (~1KB) blurred preview shown until the full image decodes.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lqipSrc}
              alt=""
              aria-hidden
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg-0/[0.08] to-transparent motion-reduce:hidden" />
          )}
        </span>
      )}

      {!failed && (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes={sizes}
          draggable={draggable}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
          className={`object-cover ${className}`}
        />
      )}
    </>
  );
}
