"use client";

import { Icon } from "@/components/ui/icon";
import { Id } from "@/convex/_generated/dataModel";

interface Export {
  _id: Id<"exports">;
  provider: string;
  status: string;
  externalUrl?: string;
  exportedData?: any;
  createdAt: number;
}

interface Feedback {
  _id: Id<"feedback">;
  type: "bug" | "feature";
  status: string;
  submitterName?: string;
  submitterEmail?: string;
  ticketNumber?: number;
}

interface Project {
  code?: string;
}

interface TicketHeaderProps {
  feedback: Feedback;
  project: Project | null | undefined;
  selectedFeedbackId: Id<"feedback">;
  exports?: Export[] | null;
  onShare: () => void;
  onDelete: () => void;
  onClose: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export function TicketHeader({
  feedback,
  project,
  selectedFeedbackId,
  exports,
  onShare,
  onDelete,
  onClose,
  isMenuOpen,
  setIsMenuOpen,
}: TicketHeaderProps) {
  return (
    <div className="flex min-h-16 items-center justify-between border-b-2 border-retro-black bg-white px-6 py-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-bold">
            {project?.code && feedback.ticketNumber
              ? `#${project.code}-${feedback.ticketNumber}`
              : `#${selectedFeedbackId.slice(-3).toUpperCase()}`}
          </span>
          <span className="h-4 w-px bg-stone-300" />
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              feedback.type === "bug"
                ? "bg-retro-red/10 text-retro-red"
                : "bg-retro-blue/10 text-retro-blue"
            }`}
          >
            {feedback.type === "bug" ? "Bug" : "Feature"}
          </span>
          <span className="h-4 w-px bg-stone-300" />
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Icon name="solar:user-circle-linear" size={16} />
            <span>{feedback.submitterName || feedback.submitterEmail || "Anonymous"}</span>
          </div>
        </div>

        {/* Routing badges for exported/resolved tickets */}
        {(feedback.status === "exported" || feedback.status === "resolved") &&
          exports &&
          exports.length > 0 && (
            <div className="flex items-center gap-1.5">
              {exports
                .filter((exp) => exp.provider !== "json" && exp.status === "success")
                .map((exp) => {
                  const providerConfig = {
                    linear: {
                      label: "Linear",
                      icon: (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                          <path d="M21.41 8.64v6.72h-5.76v-3.36h2.88V8.64a1.44 1.44 0 0 0-1.44-1.44H8.64a1.44 1.44 0 0 0-1.44 1.44V12h2.88v3.36H4.32V8.64A4.32 4.32 0 0 1 8.64 4.32h8.45a4.32 4.32 0 0 1 4.32 4.32z" />
                          <path d="M17.09 15.36v-3.36H7.2v3.36a1.44 1.44 0 0 0 1.44 1.44h8.45a4.32 4.32 0 0 1-4.32 4.32H4.32a4.32 4.32 0 0 1 4.32-4.32h8.45z" />
                        </svg>
                      ),
                      color: "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100",
                    },
                    notion: {
                      label: "Notion",
                      icon: (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
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
                      className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium transition-colors ${config.color}`}
                      title={`Routed to ${config.label}`}
                    >
                      {config.icon}
                      <span>Routed to {config.label}</span>
                      {exp.externalUrl && <Icon name="solar:arrow-right-up-linear" size={12} />}
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
          )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onShare}
          className="rounded p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
          title="Copy link to clipboard"
        >
          <Icon name="solar:link-linear" size={20} />
        </button>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
          >
            <Icon name="solar:menu-dots-linear" size={20} />
          </button>
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <button
                  onClick={onDelete}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-retro-red transition-colors hover:bg-retro-red/10"
                >
                  <Icon name="solar:trash-bin-trash-linear" size={16} />
                  Delete Ticket
                </button>
              </div>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded p-2 text-stone-500 transition-colors hover:bg-red-50 hover:text-retro-red"
        >
          <Icon name="solar:close-square-linear" size={20} />
        </button>
      </div>
    </div>
  );
}
