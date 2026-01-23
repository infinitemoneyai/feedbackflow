"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

/**
 * Routing badges component - shows where a ticket was exported to
 */
export function RoutingBadges({ feedbackId }: { feedbackId: Id<"feedback"> }) {
  const exports = useQuery(api.integrations.getExportsByFeedback, { feedbackId });

  if (!exports || exports.length === 0) return null;

  const successfulExports = exports.filter((exp) => exp.status === "success" && exp.provider !== "json");

  if (successfulExports.length === 0) return null;

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {successfulExports.map((exp) => {
        const providerConfig = {
          linear: {
            label: "Linear",
            icon: (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M21.41 8.64v6.72h-5.76v-3.36h2.88V8.64a1.44 1.44 0 0 0-1.44-1.44H8.64a1.44 1.44 0 0 0-1.44 1.44V12h2.88v3.36H4.32V8.64A4.32 4.32 0 0 1 8.64 4.32h8.45a4.32 4.32 0 0 1 4.32 4.32z" />
                <path d="M17.09 15.36v-3.36H7.2v3.36a1.44 1.44 0 0 0 1.44 1.44h8.45a4.32 4.32 0 0 1-4.32 4.32H4.32a4.32 4.32 0 0 1 4.32-4.32h8.45z" />
              </svg>
            ),
            color: "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100",
          },
          notion: {
            label: "Notion",
            icon: (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.454-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM2.1 1.408l13.028-.887c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v15.063c0 .933-.327 1.493-1.494 1.586L5.79 23.086c-.886.047-1.306-.093-1.773-.7L.944 18.107c-.56-.746-.793-1.306-.793-1.96V2.529c0-.653.327-1.214 1.166-1.12z" />
              </svg>
            ),
            color: "border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100",
          },
        };

        const config = providerConfig[exp.provider as keyof typeof providerConfig];
        if (!config) return null;

        const badge = (
          <span
            className={cn(
              "flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              config.color
            )}
            title={`Routed to ${config.label}`}
          >
            {config.icon}
            <span>{config.label}</span>
          </span>
        );

        if (exp.externalUrl) {
          return (
            <a
              key={exp._id}
              href={exp.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {badge}
            </a>
          );
        }

        return <span key={exp._id}>{badge}</span>;
      })}
    </div>
  );
}
