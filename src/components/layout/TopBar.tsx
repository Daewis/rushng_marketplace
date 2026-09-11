"use client";

import { Search, Bell, MapPin, LogIn } from "lucide-react";
import { useRush } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CONTENT_WIDTH } from "@/lib/layout";

/**
 * TopBar
 *
 * The persistent top header shown on most screens. It always renders the
 * logo, notifications bell, and account avatar/sign-in button. The search
 * field and the "deliver to" location row are optional — pass
 * `hideSearch` to suppress them on screens where search doesn't make
 * sense (Sell, Activity, Account — those are dashboard-style screens
 * where the user is managing their own stuff, not browsing the
 * marketplace).
 */
export function TopBar({ hideSearch = false }: { hideSearch?: boolean }) {
  const { user, navigate, pushToast } = useRush();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
      <div className={`mx-auto ${CONTENT_WIDTH} px-4 pt-3 pb-2.5`}>
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-2 group"
          >
            <div className="h-8 w-8 rounded-xl rush-gradient flex items-center justify-center shadow-rush">
              <span className="text-white font-extrabold text-sm">R</span>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-ink">
              rush
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pushToast({ title: "No new notifications" })}
              className="relative h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-ink-soft" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rush" />
            </button>
            {user ? (
              <button
                onClick={() => navigate("account")}
                className="rounded-full"
                aria-label="Account"
              >
                <Avatar className="h-9 w-9 ring-2 ring-rush/20">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <button
                onClick={() => navigate("account")}
                className="h-9 px-3 rounded-full rush-gradient text-white text-xs font-bold shadow-rush flex items-center gap-1"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </button>
            )}
          </div>
        </div>

        {!hideSearch && (
          <>
            <button
              onClick={() => navigate("search")}
              className="w-full flex items-center gap-2.5 bg-muted rounded-xl px-3.5 py-2.5 text-left hover:bg-muted/80 transition-colors"
            >
              <Search className="h-4 w-4 text-ink-soft" />
              <span className="text-sm text-ink-soft">
                Search products, stores, services…
              </span>
            </button>

            <div className="flex items-center gap-1 mt-2 text-xs text-ink-soft">
              <MapPin className="h-3.5 w-3.5 text-rush" />
              <span className="font-medium">Deliver to</span>
              <button className="font-semibold text-ink underline-offset-2 hover:underline">
                {user?.location || "Lagos"}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
