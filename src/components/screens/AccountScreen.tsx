"use client";

import {
  ChevronRight, ShoppingBag, Wrench, Car, Heart, MapPin,
  CreditCard, Bell, Shield, HelpCircle, LogOut, Store, Wallet,
} from "lucide-react";
import { useRush } from "@/lib/store";
import { useLogout } from "@/lib/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { naira } from "@/lib/data";

export function AccountScreen() {
  const { user, navigate, pushToast } = useRush();
  const logoutMut = useLogout();

  // If not logged in, show login prompt
  if (!user) {
    return (
      <div className="px-4 pt-16 pb-6 text-center">
        <div className="h-16 w-16 rounded-2xl rush-gradient mx-auto flex items-center justify-center shadow-rush mb-4">
          <span className="text-white font-extrabold text-2xl">R</span>
        </div>
        <h1 className="text-xl font-extrabold text-ink">Sign in to Rush</h1>
        <p className="text-sm text-ink-soft mt-1 mb-5">
          One account to shop, sell, offer services, and ride.
        </p>
        <button
          onClick={() => {
            // Force-show auth screen by navigating to a protected route
            // (AuthScreen will render because user is null)
            navigate("sell");
          }}
          className="px-6 py-3 rounded-xl rush-gradient text-white font-bold text-sm shadow-rush"
        >
          Sign in / Create account
        </button>
      </div>
    );
  }

  const vendorCap = user.capabilities?.find((c: any) => c.type === "VENDOR");
  const providerCap = user.capabilities?.find((c: any) => c.type === "SERVICE_PROVIDER");
  const riderCap = user.capabilities?.find((c: any) => c.type === "RIDER");
  const adminCap = user.capabilities?.find((c: any) => c.type === "ADMIN" && c.status === "ACTIVE");
  const walletBalance = (user as any).wallet?.balance || 0;

  const handleLogout = async () => {
    await logoutMut.mutateAsync();
    pushToast({ title: "Signed out" });
    // Hard reload to clear state
    window.location.href = "/";
  };

  return (
    <div className="pb-6">
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-xl font-extrabold text-ink tracking-tight">Account</h1>
      </div>

      {/* Profile header */}
      <div className="px-4 pt-2">
        <div className="rounded-2xl rush-gradient p-4 text-white shadow-rush relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-white/40">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold">{user.name}</p>
              <p className="text-xs opacity-90 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {user.location || "Lagos"}
              </p>
            </div>
            <button
              onClick={() => pushToast({ title: "Edit profile" })}
              className="px-2.5 py-1.5 rounded-lg bg-white/20 text-xs font-semibold backdrop-blur-sm"
            >
              Edit
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-bold">{user.capabilities?.length || 1}</p>
              <p className="text-[10px] opacity-90">Capabilities</p>
            </div>
            <div>
              <p className="text-sm font-bold">{naira(walletBalance)}</p>
              <p className="text-[10px] opacity-90">Wallet</p>
            </div>
            <div>
              <p className="text-sm font-bold">—</p>
              <p className="text-[10px] opacity-90">Reputation</p>
            </div>
          </div>
        </div>
      </div>

      {/* My activity shortcuts */}
      <section className="px-4 pt-5">
        <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">My activity</p>
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden divide-y divide-border">
          <Row icon={<ShoppingBag className="h-4 w-4" />} label="My orders" sub="Past and active orders" onClick={() => navigate("activity")} />
          <Row icon={<Wrench className="h-4 w-4" />} label="My services" sub="Service jobs you've booked" onClick={() => navigate("activity")} />
          <Row icon={<Car className="h-4 w-4" />} label="My rides" sub="Ride history" onClick={() => navigate("activity")} />
          <Row icon={<Heart className="h-4 w-4" />} label="Saved items" sub="Stores, products, providers" onClick={() => pushToast({ title: "Saved items" })} />
        </div>
      </section>

      {/* My businesses */}
      <section className="px-4 pt-5">
        <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">Earn on Rush</p>
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden divide-y divide-border">
          {(user as any).vendorProfile || vendorCap ? (
            <Row
              icon={<Store className="h-4 w-4 text-rush" />}
              label="My Store"
              sub={(user as any).vendorProfile?.businessName || "Vendor"}
              onClick={() => navigate("vendor-dashboard")}
              badge="Active"
              badgeTone="success"
            />
          ) : (
            <Row
              icon={<Store className="h-4 w-4" />}
              label="Sell products"
              sub="Open a store"
              onClick={() => navigate("onboarding-vendor")}
            />
          )}
          {(user as any).providerProfile || providerCap ? (
            <Row
              icon={<Wrench className="h-4 w-4 text-rush" />}
              label="My Services"
              sub={providerCap?.status === "ACTIVE" ? "Active" : "Verification pending"}
              onClick={() => navigate("provider-dashboard")}
              badge={providerCap?.status === "ACTIVE" ? "Active" : "Pending"}
              badgeTone={providerCap?.status === "ACTIVE" ? "success" : "warning"}
            />
          ) : (
            <Row
              icon={<Wrench className="h-4 w-4" />}
              label="Offer services"
              sub="Become a service provider"
              onClick={() => navigate("onboarding-provider")}
            />
          )}
          {riderCap ? (
            <Row
              icon={<Car className="h-4 w-4 text-rush" />}
              label="Rider Account"
              sub={riderCap.status === "ACTIVE" ? "Active" : "Verification pending"}
              onClick={() => navigate("rider-dashboard")}
              badge={riderCap.status === "ACTIVE" ? "Active" : "Pending"}
              badgeTone={riderCap.status === "ACTIVE" ? "success" : "warning"}
            />
          ) : (
            <Row
              icon={<Car className="h-4 w-4" />}
              label="Ride & deliver"
              sub="Become a rider"
              onClick={() => navigate("onboarding-rider")}
            />
          )}
        </div>
      </section>

      {/* Wallet & settings */}
      <section className="px-4 pt-5">
        <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">Wallet & settings</p>
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden divide-y divide-border">
          <Row icon={<Wallet className="h-4 w-4" />} label="Rush Wallet" sub={`${naira(walletBalance)} · Top up · Withdraw`} onClick={() => pushToast({ title: "Opening wallet" })} />
          <Row icon={<CreditCard className="h-4 w-4" />} label="Payment methods" sub="Cards, bank transfer" onClick={() => pushToast({ title: "Payment methods" })} />
          <Row icon={<MapPin className="h-4 w-4" />} label="Addresses" sub="Home, work" onClick={() => pushToast({ title: "Saved addresses" })} />
          <Row icon={<Bell className="h-4 w-4" />} label="Notifications" sub="Push, email, SMS" onClick={() => pushToast({ title: "Notification preferences" })} />
          <Row icon={<Shield className="h-4 w-4" />} label="Privacy & security" sub="Password, 2FA" onClick={() => pushToast({ title: "Security settings" })} />
          <Row icon={<HelpCircle className="h-4 w-4" />} label="Help & support" sub="FAQs, contact us" onClick={() => pushToast({ title: "Help center" })} />
        </div>
      </section>

      {/* Admin (only visible to users with the ACTIVE ADMIN capability) */}
      {adminCap && (
        <section className="px-4 pt-5">
          <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">Internal</p>
          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden divide-y divide-border">
            <Row
              icon={<Shield className="h-4 w-4 text-rush" />}
              label="Admin Panel"
              sub="Users, verifications, marketplace, operations"
              onClick={() => navigate("admin")}
              badge="Admin"
              badgeTone="warning"
            />
          </div>
        </section>
      )}

      {/* Sign out */}
      <div className="px-4 pt-5">
        <button
          onClick={handleLogout}
          disabled={logoutMut.isPending}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-border text-destructive text-sm font-semibold bg-card disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="px-4 pt-4 text-center">
        <p className="text-[10px] text-ink-soft">Rush v2.0 · One account, many possibilities</p>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  sub,
  onClick,
  badge,
  badgeTone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
  badge?: string;
  badgeTone?: "muted" | "success" | "warning";
}) {
  const badgeCls = {
    muted: "bg-muted text-ink-soft",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
  }[badgeTone];

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
    >
      <div className="h-9 w-9 rounded-xl bg-rush-soft text-rush flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-[11px] text-ink-soft line-clamp-1">{sub}</p>
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeCls}`}>
          {badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-ink-soft shrink-0" />
    </button>
  );
}
