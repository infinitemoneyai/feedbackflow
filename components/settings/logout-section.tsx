"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutSection() {
  const { signOut } = useClerk();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-stone-300 bg-stone-100">
          <LogOut className="h-6 w-6 text-stone-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-retro-black">Logout</h3>
          <p className="mt-1 text-sm text-stone-600">
            Sign out of your account on this device.
          </p>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-4 flex items-center gap-2 rounded border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium text-retro-black transition-all hover:bg-stone-50 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}
