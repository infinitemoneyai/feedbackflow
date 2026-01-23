"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

/**
 * Emergency sign-out page - always works even when stuck in broken states
 * Navigate to /sign-out to force a logout
 */
export default function SignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({ redirectUrl: "/" });
  }, [signOut]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-retro-paper">
      <div className="text-center">
        <div className="animate-pulse font-mono text-sm text-stone-500">
          Signing out...
        </div>
      </div>
    </div>
  );
}
