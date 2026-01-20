"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { ArrowLeft, Bot, Settings as SettingsIcon, Users, CreditCard, Plug, Webhook, Key, Zap, Bell, Palette, HardDrive, User, FileCode } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AiConfigSection } from "@/components/settings/ai-config-section";
import { LinearConfigSection } from "@/components/settings/linear-config-section";
import { NotionConfigSection } from "@/components/settings/notion-config-section";
import { WebhookConfigSection } from "@/components/settings/webhook-config-section";
import { RestApiKeysSection } from "@/components/settings/rest-api-keys-section";
import { AutomationRulesSection } from "@/components/settings/automation-rules-section";
import { NotificationPreferencesSection } from "@/components/settings/notification-preferences-section";
import { BillingSection } from "@/components/settings/billing-section";
import { WidgetCustomizationSection } from "@/components/settings/widget-customization-section";
import { StorageConfigSection } from "@/components/settings/storage-config-section";
import { TeamSettingsSection } from "@/components/settings/team-settings-section";
import { UserProfileSection } from "@/components/settings/user-profile-section";
import { ExportTemplatesSection } from "@/components/settings/export-templates-section";

type SettingsTab = "profile" | "widget" | "ai" | "storage" | "integrations" | "templates" | "webhooks" | "automation" | "api-keys" | "notifications" | "team" | "billing";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<Id<"widgets"> | null>(null);
  const teams = useQuery(api.teams.getMyTeams);

  // Use first team for now (team selector can be added later)
  const selectedTeamId = teams?.[0]?._id as Id<"teams"> | undefined;
  const selectedTeam = teams?.[0];

  // Get projects for the selected team
  const projects = useQuery(
    api.projects.getProjects,
    selectedTeamId ? { teamId: selectedTeamId } : "skip"
  );

  // Get widgets for the selected project
  const widgets = useQuery(
    api.projects.getWidgets,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  // Auto-select first project and widget when data loads
  const firstProject = projects?.[0];
  const firstWidget = widgets?.[0];
  if (firstProject && !selectedProjectId) {
    setSelectedProjectId(firstProject._id);
  }
  if (firstWidget && !selectedWidgetId) {
    setSelectedWidgetId(firstWidget._id);
  }

  const tabs = [
    {
      id: "profile" as const,
      label: "Profile",
      icon: User,
      description: "Your account settings",
    },
    {
      id: "widget" as const,
      label: "Widget",
      icon: Palette,
      description: "Customize widget appearance",
    },
    {
      id: "ai" as const,
      label: "AI Configuration",
      icon: Bot,
      description: "Configure AI providers and API keys",
    },
    {
      id: "storage" as const,
      label: "Storage",
      icon: HardDrive,
      description: "Configure external video storage",
    },
    {
      id: "integrations" as const,
      label: "Integrations",
      icon: Plug,
      description: "Connect Linear, Notion, and more",
    },
    {
      id: "templates" as const,
      label: "Export Templates",
      icon: FileCode,
      description: "Customize export formatting",
    },
    {
      id: "webhooks" as const,
      label: "Webhooks",
      icon: Webhook,
      description: "Configure webhook notifications",
    },
    {
      id: "automation" as const,
      label: "Automation",
      icon: Zap,
      description: "Auto-export and assign feedback",
    },
    {
      id: "api-keys" as const,
      label: "API Keys",
      icon: Key,
      description: "Manage REST API access",
    },
    {
      id: "notifications" as const,
      label: "Notifications",
      icon: Bell,
      description: "Email and in-app notification settings",
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
            {activeTab === "profile" && (
              <UserProfileSection />
            )}

            {activeTab === "widget" && (
              <div className="space-y-6">
                {/* Project/Widget selector */}
                <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-yellow bg-retro-yellow/10">
                      <Palette className="h-6 w-6 text-retro-yellow" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-retro-black">
                        Widget Customization
                      </h2>
                      <p className="mt-1 text-sm text-stone-600">
                        Customize how the feedback widget appears on your website.
                        Select a project and widget to configure.
                      </p>
                    </div>
                  </div>

                  {/* Project and Widget selectors */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700">
                        Project
                      </label>
                      <select
                        value={selectedProjectId || ""}
                        onChange={(e) => {
                          const newProjectId = e.target.value as Id<"projects">;
                          setSelectedProjectId(newProjectId);
                          setSelectedWidgetId(null); // Reset widget when project changes
                        }}
                        className="w-full rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:outline-none"
                      >
                        {!projects ? (
                          <option value="">Loading projects...</option>
                        ) : projects.length === 0 ? (
                          <option value="">No projects found</option>
                        ) : (
                          projects.map((project: { _id: Id<"projects">; name: string }) => (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700">
                        Widget
                      </label>
                      <select
                        value={selectedWidgetId || ""}
                        onChange={(e) => setSelectedWidgetId(e.target.value as Id<"widgets">)}
                        className="w-full rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:outline-none"
                        disabled={!selectedProjectId}
                      >
                        {!widgets ? (
                          <option value="">Loading widgets...</option>
                        ) : widgets.length === 0 ? (
                          <option value="">No widgets found</option>
                        ) : (
                          widgets.map((widget: { _id: Id<"widgets">; widgetKey: string; siteUrl?: string }) => (
                            <option key={widget._id} value={widget._id}>
                              {widget.siteUrl || widget.widgetKey}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Widget customization form */}
                {selectedWidgetId ? (
                  <WidgetCustomizationSection
                    widgetId={selectedWidgetId}
                    widgetKey={widgets?.find((w: { _id: Id<"widgets"> }) => w._id === selectedWidgetId)?.widgetKey}
                    projectName={projects?.find((p: { _id: Id<"projects"> }) => p._id === selectedProjectId)?.name}
                    hideHeader={true}
                  />
                ) : (
                  <div className="rounded border-2 border-stone-200 bg-stone-50 p-8 text-center">
                    <Palette className="mx-auto mb-3 h-10 w-10 text-stone-300" />
                    <p className="text-stone-500">
                      Select a project and widget to customize
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ai" && selectedTeamId && (
              <AiConfigSection teamId={selectedTeamId} />
            )}

            {activeTab === "storage" && selectedTeamId && (
              <StorageConfigSection teamId={selectedTeamId} />
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

            {activeTab === "templates" && selectedProjectId && (
              <ExportTemplatesSection projectId={selectedProjectId} />
            )}

            {activeTab === "templates" && !selectedProjectId && (
              <div className="space-y-6">
                <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-peach bg-retro-peach/10">
                      <FileCode className="h-6 w-6 text-retro-peach" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-retro-black">
                        Export Templates
                      </h2>
                      <p className="mt-1 text-sm text-stone-600">
                        Customize how feedback is formatted when exported. Select a project to configure templates.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-medium text-stone-700">
                      Select Project
                    </label>
                    <select
                      value={selectedProjectId || ""}
                      onChange={(e) => setSelectedProjectId(e.target.value as Id<"projects">)}
                      className="w-full rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:outline-none"
                    >
                      {!projects ? (
                        <option value="">Loading projects...</option>
                      ) : projects.length === 0 ? (
                        <option value="">No projects found</option>
                      ) : (
                        <>
                          <option value="">Select a project...</option>
                          {projects.map((project: { _id: Id<"projects">; name: string }) => (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "webhooks" && selectedTeamId && (
              <WebhookConfigSection teamId={selectedTeamId} />
            )}

            {activeTab === "automation" && selectedTeamId && (
              <AutomationRulesSection teamId={selectedTeamId} />
            )}

            {activeTab === "api-keys" && selectedTeamId && (
              <RestApiKeysSection teamId={selectedTeamId} />
            )}

            {activeTab === "notifications" && (
              <NotificationPreferencesSection />
            )}

            {activeTab === "team" && selectedTeamId && (
              <TeamSettingsSection teamId={selectedTeamId} />
            )}

            {activeTab === "billing" && selectedTeamId && (
              <BillingSection teamId={selectedTeamId} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
