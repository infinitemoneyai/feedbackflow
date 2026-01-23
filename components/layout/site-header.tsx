"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Icon } from "@/components/ui/icon";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/docs") {
      return pathname?.startsWith("/docs");
    }
    return pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="sticky top-0 z-50 flex flex-col divide-y-2 divide-retro-black border-b-2 border-retro-black bg-retro-paper md:flex-row md:divide-x-2 md:divide-y-0">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex self-stretch items-center gap-3 bg-retro-yellow p-4 md:p-5"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Icon name="solar:infinite-linear" size={24} />
          <span className="text-lg font-semibold uppercase tracking-tighter">
            FEEDBACK FLOW
          </span>
        </Link>
        <button
          className="p-4 md:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden flex-grow items-center justify-between gap-6 p-4 text-sm font-medium md:flex md:justify-end md:p-5">
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
            href="https://github.com/infinitemoneyai/feedbackflow"
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

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="flex flex-col gap-4 border-t-2 border-retro-black bg-retro-paper p-6 md:hidden">
          <Link
            href="/manifesto"
            className={`text-lg font-medium tracking-tight hover:text-retro-blue ${
              isActive("/manifesto") ? "text-retro-blue" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Manifesto
          </Link>
          <Link
            href="/docs"
            className={`text-lg font-medium tracking-tight hover:text-retro-blue ${
              isActive("/docs") ? "text-retro-blue" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Docs
          </Link>
          <Link
            href="/pricing"
            className={`text-lg font-medium tracking-tight hover:text-retro-blue ${
              isActive("/pricing") ? "text-retro-blue" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="https://github.com/infinitemoneyai/feedbackflow"
            className="text-lg font-medium tracking-tight hover:text-retro-blue"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            GitHub
          </Link>
          <div className="mt-4">
            {isLoaded && isSignedIn ? (
              <Link
                href="/dashboard"
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-retro-black px-5 py-3 text-white transition-all hover:bg-stone-800"
                onClick={() => setIsMobileMenuOpen(false)}
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
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-retro-black px-5 py-3 text-white transition-all hover:bg-stone-800"
                onClick={() => setIsMobileMenuOpen(false)}
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
        </div>
      )}
    </nav>
  );
}
