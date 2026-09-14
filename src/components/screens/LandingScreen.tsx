"use client";

import { useRush } from "@/lib/store";
import { RushLogo } from "@/components/RushLogo";

/**
 * LandingScreen — the 10-section marketing landing shown to unauthenticated
 * visitors. Premium, gen-Z, Lagos-first. Replaces the old minimal hero.
 *
 * Structure (in order):
 *   1. Sticky Navbar
 *   2. Hero
 *   3. What is RUSH?
 *   4. The Three Pillars
 *   5. Built around your day
 *   6. One Account / One Wallet  (dark section)
 *   7. Seller / Business Section
 *   8. Professional Section
 *   9. Lagos + Trust
 *  10. Final CTA
 *  +  Footer
 *
 * All auth-gated CTAs route to the `account` view (which renders AuthScreen
 * for logged-out users). Vendor onboarding CTAs route to `onboarding-vendor`,
 * provider onboarding CTAs route to `onboarding-provider`.
 *
 * No app chrome — this screen is rendered standalone in the landing branch
 * of `src/app/page.tsx` (no TopBar, no BottomNav).
 */
export function LandingScreen() {
  const navigate = useRush((s) => s.navigate);
  const goAccount = () => navigate("account");
  const goVendor = () => navigate("onboarding-vendor");
  const goProvider = () => navigate("onboarding-provider");

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-ink">
      {/* ─── 1. Sticky Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <RushLogo size={36} clickable={false} />
            <span className="text-lg font-extrabold tracking-tight text-ink">
              rush
            </span>
          </div>

          {/* Desktop-only nav links — decorative, no functionality */}
          <nav className="hidden items-center gap-8 md:flex">
            <span className="cursor-default text-sm font-medium text-ink-soft transition-colors hover:text-ink">
              Shop
            </span>
            <span className="cursor-default text-sm font-medium text-ink-soft transition-colors hover:text-ink">
              Services
            </span>
            <span className="cursor-default text-sm font-medium text-ink-soft transition-colors hover:text-ink">
              Rides
            </span>
            <span className="cursor-default text-sm font-medium text-ink-soft transition-colors hover:text-ink">
              For Businesses
            </span>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={goAccount}
              className="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink sm:px-4"
            >
              Log in
            </button>
            <button
              onClick={goAccount}
              className="rush-gradient rounded-full px-4 py-2 text-sm font-bold text-white shadow-rush transition-all hover:opacity-95 active:scale-95 sm:px-5"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── 2. Hero ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Ambient gradient blobs behind the hero */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-rush/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-40 -right-20 h-80 w-80 rounded-full bg-rush-deep/20 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-24">
            {/* Left: copy */}
            <div className="flex flex-col items-start text-left animate-in fade-in slide-in-from-bottom-3 duration-700">
              <p className="text-xs font-bold uppercase tracking-wider text-rush sm:text-sm">
                The everyday marketplace for Lagos
              </p>
              <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                Everything you need.{" "}
                <span className="bg-gradient-to-r from-rush to-rush-deep bg-clip-text text-transparent">
                  One RUSH.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
                Shop from local businesses. Hire trusted professionals. Book
                rides across Lagos. Get what you need delivered — all from one
                account.
              </p>

              <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  onClick={goAccount}
                  className="rush-gradient rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-rush transition-all hover:opacity-95 active:scale-95"
                >
                  Get Started
                </button>
                <button
                  onClick={goAccount}
                  className="rounded-full border border-border bg-card px-6 py-3.5 text-sm font-bold text-ink transition-all hover:bg-muted/50 active:scale-95"
                >
                  Explore RUSH
                </button>
              </div>

              <p className="mt-6 text-sm font-medium text-ink-soft">
                One account. One wallet. One trusted marketplace.
              </p>
            </div>

            {/* Right: big logo with gradient blobs */}
            <div className="relative flex items-center justify-center animate-in fade-in zoom-in-50 duration-700">
              <div
                aria-hidden
                className="absolute h-56 w-56 rounded-full bg-rush/30 blur-3xl sm:h-72 sm:w-72"
              />
              <div
                aria-hidden
                className="absolute h-40 w-40 translate-x-8 translate-y-8 rounded-full bg-rush-deep/25 blur-3xl sm:h-56 sm:w-56"
              />
              <div className="relative rounded-3xl border border-border bg-card p-6 shadow-rush sm:p-8">
                <RushLogo size={140} clickable={false} />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. What is RUSH? ───────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-12 text-center sm:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink animate-in fade-in slide-in-from-bottom-2 duration-700 sm:text-4xl">
            One app. More ways to get things done.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            RUSH brings shopping, services, delivery, and rides together in one
            marketplace built for everyday life.
          </p>

          {/* Diagram: SHOP / HIRE / RIDE → RUSH */}
          <div className="mt-12 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-stretch sm:gap-3">
            <FlowItem emoji="🛍️" label="SHOP" sub="Products" />
            <FlowArrow />
            <FlowItem emoji="🔧" label="HIRE" sub="Services" />
            <FlowArrow />
            <FlowItem emoji="🚗" label="RIDE" sub="Mobility" />
            <FlowArrow />
            <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-rush bg-card px-6 py-4 shadow-rush sm:flex-1">
              <RushLogo size={40} clickable={false} />
              <div className="text-left">
                <div className="text-lg font-extrabold tracking-tight text-ink">
                  RUSH
                </div>
                <div className="text-xs text-ink-soft">One marketplace</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. The Three Pillars ───────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-12 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Whatever you need, RUSH.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-ink-soft">
              Three ways to use RUSH — pick one or use them all.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <PillarCard
              emoji="🛍️"
              tag="SHOP"
              title="Find it. Order it. Get it."
              desc="Discover products from local businesses and have them delivered to you."
              cta="Shop on RUSH"
              onClick={goAccount}
            />
            <PillarCard
              emoji="🔧"
              tag="HIRE"
              title="Need it done? Find someone."
              desc="Connect with trusted professionals offering services around you."
              cta="Find a Pro"
              onClick={goAccount}
            />
            <PillarCard
              emoji="🚗"
              tag="RIDE"
              title="Need to move? RUSH."
              desc="Book a ride and get where you're going."
              cta="Book a Ride"
              onClick={goAccount}
            />
          </div>
        </section>

        {/* ─── 5. Built around your day ───────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-12 text-center sm:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            One place for the things you do every day.
          </h2>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-stretch">
            <DayItem emoji="☕" label="Morning" sub="Order breakfast" />
            <DayArrow />
            <DayItem emoji="🔧" label="Afternoon" sub="Book a pro" />
            <DayArrow />
            <DayItem emoji="🛍️" label="Evening" sub="Shop & deliver" />
            <DayArrow />
            <DayItem emoji="🚗" label="Later" sub="Ride home" />
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            From your first order to your last ride, RUSH keeps everything
            connected.
          </p>
        </section>

        {/* ─── 6. One Account / One Wallet (dark) ─────────────────────── */}
        <section className="bg-ink text-white">
          <div className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-24">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              One account. One wallet. One trusted marketplace.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              No jumping between different apps. Your purchases, services,
              rides, payments, and activity live together in RUSH.
            </p>

            {/* Diagram: RUSH ACCOUNT → SHOP/HIRE/RIDE → RUSH WALLET */}
            <div className="mt-12 flex flex-col items-center gap-6">
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 backdrop-blur-sm">
                <RushLogo size={36} clickable={false} />
                <div className="text-left">
                  <div className="text-sm font-bold uppercase tracking-wider text-rush">
                    Rush Account
                  </div>
                  <div className="text-xs text-white/60">Sign in once</div>
                </div>
              </div>

              <div aria-hidden className="text-2xl text-white/40">
                ↓
              </div>

              <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <PillarPill emoji="🛍️" label="SHOP" />
                <PillarPill emoji="🔧" label="HIRE" />
                <PillarPill emoji="🚗" label="RIDE" />
              </div>

              <div aria-hidden className="text-2xl text-white/40">
                ↓
              </div>

              <div className="flex items-center gap-3 rounded-2xl rush-gradient px-6 py-4 shadow-rush">
                <span className="text-2xl" aria-hidden>
                  💳
                </span>
                <div className="text-left">
                  <div className="text-sm font-bold uppercase tracking-wider">
                    Rush Wallet
                  </div>
                  <div className="text-xs text-white/80">
                    One balance for everything
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 7. Seller / Business Section ───────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-block rounded-full bg-rush-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-rush-deep">
                For Businesses
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Your business deserves to be found.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">
                Join RUSH for free. List your products. We only make money when
                you make money.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <PointItem icon="🏪" title="Open your store" />
                <PointItem icon="📍" title="Reach customers" />
                <PointItem icon="📈" title="Grow your sales" />
              </div>

              <button
                onClick={goVendor}
                className="mt-7 inline-flex items-center gap-2 rush-gradient rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-rush transition-all hover:opacity-95 active:scale-95"
              >
                Join RUSH as a Business →
              </button>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-3xl bg-rush-soft opacity-60 blur-2xl"
              />
              <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
                <div className="flex items-center gap-3">
                  <RushLogo size={48} clickable={false} />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-rush">
                      Rush for Business
                    </div>
                    <div className="text-lg font-extrabold text-ink">
                      Free to start
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <CheckRow label="No setup fees" />
                  <CheckRow label="List unlimited products" />
                  <CheckRow label="We only earn when you earn" />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Free" sub="to join" />
                  <Stat label="0%" sub="setup fee" />
                  <Stat label="1" sub="account" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 8. Professional Section ────────────────────────────────── */}
        <section className="bg-rush-soft/40">
          <div className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Visual card — appears second on mobile, first (left) on desktop */}
              <div className="order-2 lg:order-1">
                <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
                  <div className="text-5xl" aria-hidden>
                    🧰
                  </div>
                  <div className="mt-4 text-2xl font-extrabold text-ink">
                    Your skills, in demand
                  </div>
                  <div className="mt-2 text-sm text-ink-soft">
                    List your service. Get booked. Get paid.
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {[
                      "Technician",
                      "Cleaner",
                      "Stylist",
                      "Designer",
                      "Repairer",
                      "Specialist",
                    ].map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-rush-soft px-3 py-1 text-xs font-semibold text-rush-deep"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Copy — appears first on mobile, second (right) on desktop */}
              <div className="order-1 lg:order-2">
                <span className="inline-block rounded-full bg-rush-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-rush-deep">
                  For Professionals
                </span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  Your skills can take you further.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">
                  Whether you're a technician, cleaner, stylist, designer,
                  repairer, or specialist, RUSH helps you connect with people who
                  need what you do.
                </p>

                <button
                  onClick={goProvider}
                  className="mt-7 inline-flex items-center gap-2 rush-gradient rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-rush transition-all hover:opacity-95 active:scale-95"
                >
                  Become a RUSH Pro →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 9. Lagos + Trust ───────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-14 text-center sm:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Built for Lagos. Made for everyday life.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Lagos moves fast. RUSH is built to help you keep up — connecting you
            to local businesses, trusted professionals, delivery, and rides in
            one place.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TrustBadge label="Trusted businesses" />
            <TrustBadge label="Verified professionals" />
            <TrustBadge label="Secure payments" />
            <TrustBadge label="Support when you need it" />
          </div>

          <p className="mt-10 text-base font-semibold text-ink sm:text-lg">
            Your trust is what makes RUSH work.
          </p>
        </section>

        {/* ─── 10. Final CTA ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-rush/25 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl px-6 py-20 text-center sm:py-32">
            <div className="flex justify-center animate-in fade-in zoom-in-50 duration-700">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-rush">
                <RushLogo size={96} clickable={false} />
              </div>
            </div>

            <h2 className="mt-8 text-4xl font-extrabold tracking-tight text-ink animate-in fade-in slide-in-from-bottom-2 duration-700 sm:text-6xl">
              Whatever you need, just RUSH.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft sm:text-xl">
              Shop it. Hire it. Ride it. Get it delivered.
            </p>

            <button
              onClick={goAccount}
              className="mt-9 inline-flex items-center gap-2 rush-gradient rounded-full px-10 py-4 text-base font-bold text-white shadow-rush transition-all hover:opacity-95 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-75"
            >
              Get Started →
            </button>

            <p className="mt-6 text-sm font-medium text-ink-soft">
              One account. One wallet. Everything you need.
            </p>
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-2">
                <RushLogo size={32} clickable={false} />
                <span className="text-lg font-extrabold tracking-tight text-ink">
                  rush
                </span>
              </div>
              <p className="text-sm text-ink-soft">
                Everything you need. One RUSH.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8 sm:gap-12">
              <FooterLinks
                title="Marketplace"
                links={["Shop", "Services", "Rides", "Businesses"]}
              />
              <FooterLinks title="Company" links={["About", "Help", "Contact"]} />
              <FooterLinks title="Legal" links={["Terms", "Privacy"]} />
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-xs text-ink-soft">
            © 2026 RUSH
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Subcomponents ──────────────────────────────────────────────────── */

/** A source pill in the "What is RUSH?" diagram (SHOP / HIRE / RIDE). */
function FlowItem({
  emoji,
  label,
  sub,
}: {
  emoji: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-card sm:flex-1">
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <div className="text-left">
        <div className="text-sm font-extrabold tracking-tight text-ink">
          {label}
        </div>
        <div className="text-xs text-ink-soft">{sub}</div>
      </div>
    </div>
  );
}

/** Arrow between flow items — ↓ on mobile, → on desktop. */
function FlowArrow() {
  return (
    <span
      aria-hidden
      className="self-center text-2xl text-rush rotate-90 sm:rotate-0"
    >
      →
    </span>
  );
}

/** A pillar card (SHOP / HIRE / RIDE) in section 4. */
function PillarCard({
  emoji,
  tag,
  title,
  desc,
  cta,
  onClick,
}: {
  emoji: string;
  tag: string;
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="group flex flex-col rounded-3xl border border-border bg-card p-6 shadow-card transition-all hover:border-rush/40 hover:shadow-rush sm:p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rush-soft text-3xl">
        <span aria-hidden>{emoji}</span>
      </div>
      <div className="mt-5 text-xs font-bold uppercase tracking-wider text-rush">
        {tag}
      </div>
      <h3 className="mt-1 text-xl font-extrabold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{desc}</p>
      <button
        onClick={onClick}
        className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-rush-deep transition-all hover:gap-2"
      >
        {cta} →
      </button>
    </div>
  );
}

/** A day-stage card in section 5 (Morning / Afternoon / Evening / Later). */
function DayItem({
  emoji,
  label,
  sub,
}: {
  emoji: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-5 text-center shadow-card sm:flex-1">
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <div>
        <div className="text-sm font-extrabold tracking-tight text-ink">
          {label}
        </div>
        <div className="text-xs text-ink-soft">{sub}</div>
      </div>
    </div>
  );
}

/** Arrow between day items — ↓ on mobile, → on desktop. */
function DayArrow() {
  return (
    <span
      aria-hidden
      className="self-center text-2xl text-rush rotate-90 sm:rotate-0"
    >
      →
    </span>
  );
}

/** A small pill (SHOP / HIRE / RIDE) inside the dark section 6 diagram. */
function PillarPill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-4 backdrop-blur-sm">
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </div>
  );
}

/** A bullet point (icon + title) in the Seller section. */
function PointItem({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rush-soft text-xl">
        <span aria-hidden>{icon}</span>
      </div>
      <div className="text-sm font-bold text-ink">{title}</div>
    </div>
  );
}

/** A checkmark row used inside the seller visual card. */
function CheckRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-soft">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rush text-xs font-bold text-white">
        ✓
      </span>
      {label}
    </div>
  );
}

/** A small stat tile (label + sub) inside the seller visual card. */
function Stat({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-rush-soft/60 px-2 py-3">
      <div className="text-lg font-extrabold text-rush-deep">{label}</div>
      <div className="text-xs text-ink-soft">{sub}</div>
    </div>
  );
}

/** A trust badge in section 9. */
function TrustBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-card">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rush text-xs font-bold text-white">
        ✓
      </span>
      <span className="text-sm font-semibold text-ink">{label}</span>
    </div>
  );
}

/** A column of footer links — decorative, no functionality. */
function FooterLinks({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-ink-soft">
        {title}
      </div>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <span className="cursor-default text-sm text-ink transition-colors hover:text-rush">
              {l}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
