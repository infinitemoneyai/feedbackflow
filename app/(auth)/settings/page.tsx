"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { ArrowLeft, Bot, Settings as SettingsIcon, Users, CreditCard, Plug } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AiConfigSection } from "@/components/settings/ai-config-section";
import { LinearConfigSection } from "@/components/settings/linear-config-section";

type SettingsTab = "ai" | "integrations" | "team" | "billing";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("ai");
  const teams = useQuery(api.teams.getMyTeams);

  // Use first team for now (team selector can be added later)
  const selectedTeamId = teams?.[0]?._id as Id<"teams"> | undefined;
  const selectedTeam = teams?.[0];

  const tabs = [
    {
      id: "ai" as const,
      label: "AI Configuration",
      icon: Bot,
      description: "Configure AI providers and API keys",
    },
    {
      id: "integrations" as const,
      label: "Integrations",
      icon: Plug,
      description: "Connect Linear, Notion, and more",
    },
    {
      id: "team" as const,
      label: "Team",
      icon: Users,
      description: "Manage team members and settings",
    },
    {
      id: "billing" as const,
      label: "Billing",
      icon: CreditCard,
      description: "Subscription and usage",
    },
  ];

  if (!teams) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-retro-paper">
        <div className="animate-pulse font-mono text-sm text-stone-500">
          Loading...
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-retro-paper">
        <div className="text-center">
          <p className="mb-4 text-stone-600">No team found</p>
          <Link
            href="/dashboard"
            className="text-retro-blue hover:underline"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-paper">
      {/* Header */}
      <header className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-retro-black bg-retro-yellow shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-retro-black">Settings</h1>
              <p className="text-xs text-stone-500">{selectedTeam?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar navigation */}
          <nav className="lg:w-64">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded px-4 py-3 text-left text-sm transition-all ${
                      isActive
                        ? "border-2 border-retro-black bg-white font-medium shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
                        : "border-2 border-transparent text-stone-600 hover:border-stone-200 hover:bg-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className={isActive ? "text-retro-black" : ""}>
                        {tab.label}
                      </div>
                      <div className="text-xs text-stone-400">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1">
            {activeTab === "ai" && selectedTeamId && (
              <AiConfigSection teamId={selectedTeamId} />
            )}

            {activeTab === "integrations" && selectedTeamId && (
              <div className="space-y-6">
                {/* Header */}
                <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-lavender bg-retro-lavender/10">
                      <Plug className="h-6 w-6 text-retro-lavender" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-retro-black">
                        Integrations
                      </h2>
                      <p className="mt-1 text-sm text-stone-600">
                        Connect FeedbackFlow to your favorite tools. Export feedback
                        to Linear, Notion, or JSON format for your workflow.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Linear Integration */}
                <LinearConfigSection teamId={selectedTeamId} />

                {/* Notion placeholder */}
                <div className="rounded border-2 border-stone-200 bg-stone-50 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-300 bg-white">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 text-stone-600"
                        fill="currentColor"
                      >
                        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.454-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM2.1 1.408l13.028-.887c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v15.063c0 .933-.327 1.493-1.494 1.586L5.79 23.086c-.886.047-1.306-.093-1.773-.7L.944 18.107c-.56-.746-.793-1.306-.793-1.96V2.529c0-.653.327-1.214 1.166-1.12z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-600">Notion</h3>
                      <p className="text-xs text-stone-400">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "team" && (
              <div className="rounded border-2 border-retro-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                <h2 className="mb-4 text-xl font-semibold text-retro-black">
                  Team Settings
                </h2>
                <p className="text-stone-500">
                  Team management features coming soon.
                </p>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="rounded border-2 border-retro-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                <h2 className="mb-4 text-xl font-semibold text-retro-black">
                  Billing
                </h2>
                <p className="text-stone-500">
                  Billing features coming soon.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
