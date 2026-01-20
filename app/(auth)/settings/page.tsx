"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { ArrowLeft, Bot, Settings as SettingsIcon, Users, CreditCard, Plug, Webhook } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AiConfigSection } from "@/components/settings/ai-config-section";
import { LinearConfigSection } from "@/components/settings/linear-config-section";
import { NotionConfigSection } from "@/components/settings/notion-config-section";
import { WebhookConfigSection } from "@/components/settings/webhook-config-section";

type SettingsTab = "ai" | "integrations" | "webhooks" | "team" | "billing";

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
      id: "webhooks" as const,
      label: "Webhooks",
      icon: Webhook,
      description: "Configure webhook notifications",
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

                {/* Notion Integration */}
                <NotionConfigSection teamId={selectedTeamId} />
              </div>
            )}

            {activeTab === "webhooks" && selectedTeamId && (
              <WebhookConfigSection teamId={selectedTeamId} />
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
