"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Bell,
  Mail,
  Loader2,
  Check,
  MessageSquare,
  UserPlus,
  AlertCircle,
  Send,
  Clock,
  Inbox,
} from "lucide-react";
import { api } from "@/convex/_generated/api";

export function NotificationPreferencesSection() {
  const preferences = useQuery(api.notifications.getNotificationPreferences);
  const upsertPreferences = useMutation(api.notifications.upsertNotificationPreferences);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state for form
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState<"instant" | "daily" | "weekly">("instant");
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [events, setEvents] = useState({
    newFeedback: true,
    assignment: true,
    comments: true,
    mentions: true,
    exports: true,
  });

  // Initialize form state from preferences
  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.emailEnabled);
      setEmailFrequency(preferences.emailFrequency);
      setInAppEnabled(preferences.inAppEnabled);
      setEvents(preferences.events);
    }
  }, [preferences]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await upsertPreferences({
        emailEnabled,
        emailFrequency,
        inAppEnabled,
        events,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  }, [emailEnabled, emailFrequency, inAppEnabled, events, upsertPreferences]);

  const toggleEvent = (key: keyof typeof events) => {
    setEvents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const eventOptions = [
    {
      key: "newFeedback" as const,
      label: "New Feedback",
      description: "When new feedback is submitted to your projects",
      icon: Inbox,
    },
    {
      key: "assignment" as const,
      label: "Assignments",
      description: "When feedback is assigned to you",
      icon: UserPlus,
    },
    {
      key: "comments" as const,
      label: "Comments",
      description: "When someone comments on feedback you're following",
      icon: MessageSquare,
    },
    {
      key: "mentions" as const,
      label: "Mentions",
      description: "When someone mentions you in a comment",
      icon: AlertCircle,
    },
    {
      key: "exports" as const,
      label: "Export Updates",
      description: "When exports complete or fail",
      icon: Send,
    },
  ];

  if (preferences === undefined) {
    return (
      <div className="rounded border-2 border-retro-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-peach bg-retro-peach/10">
            <Bell className="h-6 w-6 text-retro-peach" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-retro-black">
              Notification Preferences
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Control how and when you receive notifications about feedback,
              comments, and other activity in your projects.
            </p>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between border-b-2 border-retro-black bg-stone-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-stone-600" />
            <div>
              <h3 className="font-semibold text-retro-black">Email Notifications</h3>
              <p className="text-xs text-stone-500">Receive updates via email</p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-retro-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-retro-black/20"></div>
          </label>
        </div>

        {emailEnabled && (
          <div className="p-6">
            {/* Email Frequency */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-stone-700">
                Email Frequency
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    value: "instant" as const,
                    label: "Instant",
                    description: "Get notified immediately",
                    icon: Bell,
                  },
                  {
                    value: "daily" as const,
                    label: "Daily Digest",
                    description: "Summary at 9am daily",
                    icon: Clock,
                  },
                  {
                    value: "weekly" as const,
                    label: "Weekly Digest",
                    description: "Summary on Mondays",
                    icon: Clock,
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEmailFrequency(option.value)}
                    className={`flex flex-col items-start rounded border-2 p-4 text-left transition-all ${
                      emailFrequency === option.value
                        ? "border-retro-black bg-retro-yellow/10 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4 text-stone-500" />
                      <span className="font-medium text-retro-black">
                        {option.label}
                      </span>
                    </div>
                    <span className="mt-1 text-xs text-stone-500">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {emailFrequency !== "instant" && (
              <div className="mb-6 rounded border border-retro-yellow/50 bg-retro-yellow/10 p-3">
                <p className="text-sm text-stone-600">
                  <strong>Note:</strong> With {emailFrequency} digest, notifications are
                  collected and sent as a summary email
                  {emailFrequency === "daily" ? " each morning at 9am" : " every Monday at 9am"}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* In-App Notifications */}
      <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between border-b-2 border-retro-black bg-stone-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-stone-600" />
            <div>
              <h3 className="font-semibold text-retro-black">In-App Notifications</h3>
              <p className="text-xs text-stone-500">
                See updates in the dashboard
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={inAppEnabled}
              onChange={(e) => setInAppEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-retro-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-retro-black/20"></div>
          </label>
        </div>
      </div>

      {/* Notification Events */}
      <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="border-b-2 border-retro-black bg-stone-50 px-6 py-4">
          <h3 className="font-semibold text-retro-black">Notification Events</h3>
          <p className="text-xs text-stone-500">
            Choose which events you want to be notified about
          </p>
        </div>

        <div className="divide-y divide-stone-100">
          {eventOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div
                key={option.key}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-stone-100">
                    <Icon className="h-5 w-5 text-stone-500" />
                  </div>
                  <div>
                    <p className="font-medium text-retro-black">{option.label}</p>
                    <p className="text-xs text-stone-500">{option.description}</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={events[option.key]}
                    onChange={() => toggleEvent(option.key)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-retro-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-retro-black/20"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saveSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Preferences saved
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  );
}
