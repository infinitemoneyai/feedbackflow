"use client";

import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DashboardPage() {
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <div className="min-h-screen bg-retro-paper">
      {/* Header */}
      <header className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <h1 className="font-mono text-xl font-bold tracking-tight text-retro-black">
            FeedbackFlow
          </h1>
          <div className="flex items-center gap-4">
            {currentUser && (
              <span className="text-sm text-stone-600">
                {currentUser.name || currentUser.email}
              </span>
            )}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox:
                    "h-8 w-8 border-2 border-retro-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-none border-2 border-retro-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <h2 className="mb-4 text-2xl font-medium tracking-tight text-retro-black">
            Welcome to your Dashboard
          </h2>
          <p className="text-stone-600">
            This is a protected page. Only authenticated users can see this.
          </p>
          {currentUser && (
            <div className="mt-6 rounded border border-stone-200 bg-stone-50 p-4">
              <h3 className="mb-2 font-mono text-sm font-semibold text-stone-500 uppercase">
                Your Profile
              </h3>
              <dl className="space-y-1 font-mono text-sm">
                <div className="flex gap-2">
                  <dt className="text-stone-500">Email:</dt>
                  <dd className="text-retro-black">{currentUser.email}</dd>
                </div>
                {currentUser.name && (
                  <div className="flex gap-2">
                    <dt className="text-stone-500">Name:</dt>
                    <dd className="text-retro-black">{currentUser.name}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
