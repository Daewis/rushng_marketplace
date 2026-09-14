"use client";

/**
 * RushLogo — the Rush wordmark + mark.
 *
 * Renders the real `/rush-logo.jpg` asset (a 1024×1024 JPEG exported
 * from the brand kit) instead of the old orange "R" square. Used in
 * the TopBar, the auth screen header, the landing gate, and the
 * AccountScreen (logged-out state).
 *
 * Why `<img>` and not `next/image`:
 *   - The asset lives in `/public` and is a fixed-size JPEG — no
 *     optimizer benefit, no responsive sizes needed.
 *   - Skipping next/image avoids configuring a remote pattern and
 *     keeps the component usable in client/server contexts alike.
 *
 * Props:
 *   - size: pixel size of the square mark (defaults to 32, matching
 *     the previous `h-8 w-8` orange square used in the TopBar).
 *   - withWordmark: when true, renders the image + a "rush" text
 *     wordmark next to it (used in headers).
 *   - wordmarkClass: Tailwind classes for the wordmark <span>. Defaults
 *     to `text-lg` so it visually matches the previous TopBar sizing.
 *   - className: extra classes for the wrapping element.
 */
interface RushLogoProps {
  size?: number;
  withWordmark?: boolean;
  wordmarkClass?: string;
  className?: string;
}

export function RushLogo({
  size = 32,
  withWordmark = false,
  wordmarkClass = "text-lg",
  className = "",
}: RushLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/rush-logo.jpg"
        alt="Rush"
        width={size}
        height={size}
        className="rounded-lg object-cover"
        style={{ width: size, height: size }}
        // The logo has intrinsic 1024×1024 dimensions; the explicit
        // width/height + style avoid layout shift while the JPEG loads.
        draggable={false}
      />
      {withWordmark && (
        <span
          className={`font-extrabold tracking-tight text-ink ${wordmarkClass}`}
        >
          rush
        </span>
      )}
    </span>
  );
}
