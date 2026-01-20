"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Icon } from "@/components/ui/icon";

export function SiteHeader() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  const isActive = (path: string) => {
    if (path === "/docs") {
      return pathname?.startsWith("/docs");
    }
    return pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 flex flex-col divide-y-2 divide-retro-black border-b-2 border-retro-black bg-retro-paper md:flex-row md:divide-x-2 md:divide-y-0">
      <Link
        href="/"
        className="flex items-center gap-3 bg-retro-yellow p-4 md:p-5"
      >
        <Icon name="solar:infinite-linear" size={24} />
        <span className="text-lg font-semibold uppercase tracking-tighter">
          FEEDBACK FLOW
        </span>
      </Link>
      <div className="flex flex-grow items-center justify-between gap-6 p-4 text-sm font-medium md:justify-end md:p-5">
        <div className="flex gap-6">
          <Link
            href="/manifesto"
            className={`tracking-tight transition-colors hover:text-retro-blue ${
              isActive("/manifesto") ? "text-retro-blue" : ""
            }`}
          >
            Manifesto
          </Link>
          <Link
            href="/docs"
            className={`tracking-tight transition-colors hover:text-retro-blue ${
              isActive("/docs") ? "text-retro-blue" : ""
            }`}
          >
            Docs
          </Link>
          <Link
            href="/pricing"
            className={`tracking-tight transition-colors hover:text-retro-blue ${
              isActive("/pricing") ? "text-retro-blue" : ""
            }`}
          >
            Pricing
          </Link>
          <Link
            href="https://github.com/Mlock/feedbackflow"
            className="tracking-tight transition-colors hover:text-retro-blue"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </Link>
        </div>
        {isLoaded && isSignedIn ? (
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 rounded-full bg-retro-black px-5 py-2 text-white transition-all hover:scale-105 hover:bg-stone-800"
          >
            <span>Dashboard</span>
            <Icon
              name="solar:arrow-right-linear"
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        ) : (
          <Link
            href="/sign-up"
            className="group flex items-center gap-2 rounded-full bg-retro-black px-5 py-2 text-white transition-all hover:scale-105 hover:bg-stone-800"
          >
            <span>Get Access</span>
            <Icon
              name="solar:arrow-right-linear"
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        )}
      </div>
    </nav>
  );
}
