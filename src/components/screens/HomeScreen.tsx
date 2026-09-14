"use client";

import { memo } from "react";
import { ShoppingBag, Wrench, Car, ChevronRight, Store, Sparkle, Star } from "lucide-react";
import { useRush } from "@/lib/store";
import { useProducts, useStores, useProviders } from "@/lib/hooks";
import { naira } from "@/lib/data";
import { SectionHeader, ProductCard, VendorCard, EmptyState } from "@/components/shared/Cards";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataState } from "@/components/shared/DataState";

/**
 * HomeScreen — wrapped in React.memo so it doesn't re-render when
 * the parent (HomePage) re-renders for reasons unrelated to this
 * screen (e.g. auth hydration flipping `user` from null → record,
 * toasts pushing, cart updates). The only props are zero, so the
 * default shallow comparison is sufficient — re-renders now happen
 * only when this screen's own TanStack Query data changes.
 */
export const HomeScreen = memo(function HomeScreen() {
  // Select only the slice we use — without a selector, useRush()
  // subscribes to the entire store and re-renders on every cart /
  // toast / search update.
  const user = useRush((s) => s.user);
  const navigate = useRush((s) => s.navigate);
  const productsQ = useProducts();
  const storesQ = useStores();
  const providersQ = useProviders();

  const popularProducts = (productsQ.data?.products || []).slice(0, 6);
  const topVendors = (storesQ.data?.vendors || []).filter((v) => v.visibility === "PUBLIC").slice(0, 4);
  const topProviders = (providersQ.data?.providers || []).slice(0, 2);

  // ─── Stale-while-revalidate error handling ────────────────────────
  // Previously: `const error = productsQ.error || storesQ.error || ...`
  // This tripped the error state even when cached data was still
  // available — a background refetch that failed (Vercel cold start,
  // transient network blip) would set `error` on the query object
  // but `data` was still there. The homepage would switch to
  // "Something went wrong" even though it could show real data.
  //
  // Now: only show the error state if we have NO data from ANY of
  // the three queries. If at least one has data, we render what we
  // have. A failed background refetch is silent — the user keeps
  // seeing the last good data.
  const hasAnyData = !!(productsQ.data || storesQ.data || providersQ.data);
  const allErrored = !!(productsQ.error && storesQ.error && providersQ.error);
  const error = !hasAnyData && allErrored
    ? (productsQ.error || storesQ.error || providersQ.error)
    : null;
  const loading = (productsQ.isLoading || storesQ.isLoading) && !hasAnyData;
  const isEmpty = !loading && !error && popularProducts.length === 0 && topVendors.length === 0 && topProviders.length === 0;

  return (
    <div className="pb-6">
      {/* Greeting */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs text-ink-soft">
          Hello{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </p>
        <h1 className="text-xl font-extrabold text-ink tracking-tight mt-0.5">
          What do you need today?
        </h1>
      </div>

      {/* 3 primary actions */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-3 gap-2.5">
          <PrimaryAction
            label="Shop"
            sublabel="Buy things"
            icon={<ShoppingBag className="h-5 w-5" />}
            tone="rush"
            onClick={() => navigate("shop")}
          />
          <PrimaryAction
            label="Services"
            sublabel="Hire pros"
            icon={<Wrench className="h-5 w-5" />}
            tone="ink"
            onClick={() => navigate("services")}
          />
          <PrimaryAction
            label="Rides"
            sublabel="Get around"
            icon={<Car className="h-5 w-5" />}
            tone="rush-deep"
            onClick={() => navigate("ride")}
          />
        </div>
      </div>

      {/* Promo banner */}
      <div className="px-4 pt-4">
        <div className="rush-gradient rounded-2xl p-4 text-white shadow-rush relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-8 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkle className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                New on Rush
              </span>
            </div>
            <p className="text-base font-bold leading-tight">
              Open your store in 5 minutes
            </p>
            <p className="text-xs opacity-90 mt-0.5 mb-3 max-w-[15rem]">
              Sell to thousands of buyers across Lagos. Free to start.
            </p>
            <button
              onClick={() => navigate("onboarding-vendor")}
              className="bg-white text-rush-deep text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              Start selling →
            </button>
          </div>
        </div>
      </div>

      <DataState
        isLoading={loading}
        error={error}
        isEmpty={isEmpty}
        onRetry={() => { void productsQ.refetch(); void storesQ.refetch(); void providersQ.refetch(); }}
        empty={
          <div className="px-4 pt-6">
            <EmptyState
              title="Nothing here yet"
              description="Be the first to add products and stores to Rush."
            />
          </div>
        }
      >
        <>
          {/* Popular near you */}
          {popularProducts.length > 0 && (
            <section className="px-4 pt-6">
              <SectionHeader
                title="Popular near you"
                action="See all"
                onAction={() => navigate("shop")}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-4">
                {popularProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* Top stores */}
          {topVendors.length > 0 && (
            <section className="px-4 pt-7">
              <SectionHeader
                title="Top stores"
                action="Browse stores"
                onAction={() => navigate("explore")}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {topVendors.map((v) => (
                  <VendorCard key={v.id} vendor={v} />
                ))}
              </div>
            </section>
          )}

          {/* Recommended providers */}
          {topProviders.length > 0 && (
            <section className="px-4 pt-7">
              <SectionHeader
                title="Service providers"
                action="See all"
                onAction={() => navigate("services")}
              />
              <div className="space-y-2.5">
                {topProviders.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate("provider", { providerId: p.slug })}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-card text-left hover:shadow-md transition-shadow"
                  >
                    <Avatar className="h-14 w-14 rounded-xl">
                      {p.avatar && <AvatarImage src={p.avatar} alt={p.businessName} />}
                      <AvatarFallback>{p.businessName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ink line-clamp-1">
                        {p.businessName}
                      </p>
                      <p className="text-[11px] text-ink-soft line-clamp-1">{p.tagline}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="flex items-center gap-0.5 font-semibold text-ink">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          {p.rating}
                        </span>
                        <span className="text-ink-soft">·</span>
                        <span className="text-ink-soft">From {naira(p.startingPrice)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-soft shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      </DataState>

      {/* Become a rider banner */}
      <section className="px-4 pt-7">
        <button
          onClick={() => navigate("onboarding-rider")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-ink text-white text-left"
        >
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Car className="h-5 w-5 text-rush" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Earn with your bike or car</p>
            <p className="text-xs opacity-80 mt-0.5">
              Become a Rush Rider. Flexible hours, daily payouts.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 opacity-70" />
        </button>
      </section>

      <div className="px-4 pt-6 text-center">
        <p className="text-[11px] text-ink-soft">
          Rush · One account, many possibilities
        </p>
      </div>
    </div>
  );
});

function PrimaryAction({
  label,
  sublabel,
  icon,
  tone,
  onClick,
}: {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  tone: "rush" | "ink" | "rush-deep";
  onClick: () => void;
}) {
  const toneCls = {
    rush: "rush-gradient text-white shadow-rush",
    ink: "bg-ink text-white",
    "rush-deep": "bg-rush-deep text-white",
  }[tone];

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-2 p-3 rounded-2xl ${toneCls} hover:scale-[1.02] active:scale-[0.98] transition-transform`}
    >
      <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
        {icon}
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[10px] opacity-85">{sublabel}</p>
      </div>
    </button>
  );
}
