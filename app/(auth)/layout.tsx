"use client";

import { useStoreUser } from "@/lib/hooks/use-store-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useStoreUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-retro-paper">
        <div className="animate-pulse font-mono text-sm text-stone-500">
          Loading...
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
