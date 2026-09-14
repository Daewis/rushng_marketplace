"use client";

import { ShoppingBag, Wrench, Car, ShieldCheck, Zap, TrendingUp } from "lucide-react";
import { useRush } from "@/lib/store";
import { RushLogo } from "@/components/RushLogo";
import { CONTENT_WIDTH } from "@/lib/layout";

/**
 * LandingScreen — full-screen "gate" shown to first-time visitors who
 * aren't yet authenticated and aren't on a protected route.
 *
 * Replaces the previous behavior of dropping a logged-out user
 * straight onto the homepage (which shows a half-empty TopBar with a
 * "Sign in" button and an empty HomeScreen). Instead we present a
 * gen-Z-flavored hero that explains what Rush is and funnels the
 * visitor toward account creation.
 *
 * Both CTAs route to the `account` view — that screen renders the
 * AuthScreen when there's no user, so "Get started" and "I already
 * have an account" both end up at the same place; the visual
 * difference is just which one the user clicks.
 */
export function LandingScreen() {
  const navigate = useRush((s) => s.navigate);

  return (
    <div className={`relative min-h-screen overflow-hidden bg-background ${CONTENT_WIDTH} mx-auto`}>
      {/* ─── Ambient gradient blobs ────────────────────────────────────
          Three soft, blurred OKLCH circles anchored to the corners.
          They're decorative only — `pointer-events-none` so they
          don't intercept taps on the buttons below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{ background: "oklch(0.7 0.18 35)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -right-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
        style={{ background: "oklch(0.65 0.2 320)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "oklch(0.7 0.16 200)" }}
      />

      {/* ─── Content ─────────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center px-6 pt-16 pb-10 text-center min-h-screen justify-center">
        {/* Big logo with fade-in */}
        <div className="animate-in fade-in zoom-in-50 duration-700 mb-6">
          <RushLogo size={88} clickable={false} />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold tracking-tight text-ink animate-in fade-in slide-in-from-bottom-2 duration-700">
          rush
        </h1>

        {/* Tagline */}
        <p className="mt-2 text-base font-semibold text-rush animate-in fade-in slide-in-from-bottom-2 duration-700 delay-75">
          Shop. Sell. Ride. Hire.
        </p>

        {/* Description */}
        <p className="mt-3 max-w-md text-sm text-ink-soft leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          One app for shopping from local vendors, hiring service pros, and
          booking rides across Lagos. Open a store, list a service, or hit
          the road — all from a single account.
        </p>

        {/* CTAs */}
        <div className="mt-7 w-full max-w-sm flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
          <button
            onClick={() => navigate("account")}
            className="w-full py-3.5 rounded-xl rush-gradient text-white font-bold text-sm shadow-rush hover:opacity-95 active:scale-[0.99] transition-all"
          >
            Get started
          </button>
          <button
            onClick={() => navigate("account")}
            className="w-full py-3.5 rounded-xl bg-card border border-border text-ink font-semibold text-sm shadow-card hover:bg-muted/50 transition-colors"
          >
            I already have an account
          </button>
        </div>

        {/* Feature pills */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          <FeaturePill icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Shop" />
          <FeaturePill icon={<Wrench className="h-3.5 w-3.5" />} label="Services" />
          <FeaturePill icon={<Car className="h-3.5 w-3.5" />} label="Rides" />
        </div>

        {/* Trust badges */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
          <TrustBadge
            icon={<ShieldCheck className="h-4 w-4 text-rush" />}
            label="Secure payments"
          />
          <TrustBadge
            icon={<Zap className="h-4 w-4 text-rush" />}
            label="Fast delivery"
          />
          <TrustBadge
            icon={<TrendingUp className="h-4 w-4 text-rush" />}
            label="Grow your business"
          />
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">
      {icon}
      {label}
    </span>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-3 py-2.5 shadow-sm">
      {icon}
      <span className="text-xs font-medium text-ink-soft">{label}</span>
    </div>
  );
}
