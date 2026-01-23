"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState, useRef } from "react";

/**
 * Hook that syncs the Clerk user to Convex on sign-in
 * Call this in layouts that require authentication
 * 
 * Returns isUserSynced to indicate when the Convex user record is ready
 * This prevents race conditions where queries run before user exists in DB
 */
export function useStoreUser() {
  const { user, isLoaded } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);
  const [isUserSynced, setIsUserSynced] = useState(false);
  const syncAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsUserSynced(false);
      syncAttemptedRef.current = false;
      return;
    }

    // Prevent duplicate sync attempts
    if (syncAttemptedRef.current) return;
    syncAttemptedRef.current = true;

    const syncUser = async () => {
      try {
        await upsertUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          name: user.fullName ?? user.firstName ?? undefined,
          avatar: user.imageUrl ?? undefined,
        });
        setIsUserSynced(true);
      } catch (error) {
        console.error("Failed to sync user to Convex:", error);
        // Still mark as synced to prevent infinite loading
        // The user might already exist from a previous session
        setIsUserSynced(true);
      }
    };

    syncUser();
  }, [isLoaded, user, upsertUser]);

  return { user, isLoaded, isUserSynced };
}
