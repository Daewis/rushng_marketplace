/**
 * Ambient animated background.
 *
 * Renders three soft, drifting gradient blobs behind the rest of the
 * app. Purely decorative — sits at z-index: -1 and never intercepts
 * pointer events.
 *
 * Why a component instead of just CSS on <body>:
 *   - We want it server-rendered and consistent across all routes.
 *   - Keeping it as its own component makes it trivial to disable
 *     on specific routes (e.g. the AuthScreen already has its own
 *     gradient header).
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="rush-ambient-bg" data-testid="ambient-bg">
      <div className="rush-ambient-blob-3" />
    </div>
  );
}
