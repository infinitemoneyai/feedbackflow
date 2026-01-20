"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

/**
 * Hook that syncs the Clerk user to Convex on sign-in
 * Call this in layouts that require authentication
 */
export function useStoreUser() {
  const { user, isLoaded } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      try {
        await upsertUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          name: user.fullName ?? user.firstName ?? undefined,
          avatar: user.imageUrl ?? undefined,
        });
      } catch (error) {
        console.error("Failed to sync user to Convex:", error);
      }
    };

    syncUser();
  }, [isLoaded, user, upsertUser]);

  return { user, isLoaded };
}
