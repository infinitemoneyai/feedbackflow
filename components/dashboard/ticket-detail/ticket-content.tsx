"use client";

import { Icon } from "@/components/ui/icon";
import { ScreenshotViewer } from "../screenshot-viewer";
import { VideoPlayer } from "../video-player";

interface Metadata {
  browser?: string;
  os?: string;
  url?: string;
  screenWidth?: number;
  screenHeight?: number;
  timestamp: number;
}

interface Feedback {
  title: string;
  description?: string;
  metadata: Metadata;
  submitterName?: string;
  submitterEmail?: string;
  screenshotUrl?: string;
  recordingUrl?: string;
  recordingDuration?: number;
}

interface TicketContentProps {
  feedback: Feedback;
}

export function TicketContent({ feedback }: TicketContentProps) {
  return (
    <div className="space-y-6">
      {/* Ticket Title & Description */}
      <div>
        <h2 className="mb-3 text-2xl font-semibold leading-tight tracking-tight text-retro-black">
          {feedback.title}
        </h2>

        {/* Device tags */}
        {(feedback.metadata?.browser || feedback.metadata?.os) && (
          <div className="mb-4 flex gap-2">
            {feedback.metadata.browser && (
              <span className="border border-retro-black bg-white px-2 py-1 font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {feedback.metadata.browser}
              </span>
            )}
            {feedback.metadata.os && (
              <span className="border border-retro-black bg-white px-2 py-1 font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {feedback.metadata.os}
              </span>
            )}
          </div>
        )}

        {feedback.description && (
          <p className="leading-relaxed text-stone-600">{feedback.description}</p>
        )}

        {/* Contact & Metadata - Collapsible */}
        <details className="group mt-4 rounded border-2 border-stone-200 bg-stone-50">
          <summary className="flex cursor-pointer items-center justify-between p-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100">
            <div className="flex items-center gap-2">
              <Icon name="solar:info-circle-linear" size={16} />
              <span>Contact & Technical Details</span>
            </div>
            <Icon
              name="solar:alt-arrow-down-linear"
              size={16}
              className="transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="space-y-3 border-t-2 border-stone-200 p-3">
            {/* Contact Info */}
            {(feedback.submitterName || feedback.submitterEmail) && (
              <div>
                <h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Contact
                </h4>
                <div className="space-y-1.5 text-sm">
                  {feedback.submitterName && (
                    <div className="flex items-center gap-2">
                      <Icon name="solar:user-linear" size={14} className="text-stone-400" />
                      <span className="text-stone-600">{feedback.submitterName}</span>
                    </div>
                  )}
                  {feedback.submitterEmail && (
                    <div className="flex items-center gap-2">
                      <Icon name="solar:letter-linear" size={14} className="text-stone-400" />
                      <a
                        href={`mailto:${feedback.submitterEmail}`}
                        className="text-retro-blue hover:underline"
                      >
                        {feedback.submitterEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div>
              <h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Technical Details
              </h4>
              <div className="space-y-1.5 text-sm">
                {feedback.metadata.url && (
                  <div className="flex items-start gap-2">
                    <Icon
                      name="solar:link-linear"
                      size={14}
                      className="mt-0.5 flex-shrink-0 text-stone-400"
                    />
                    <a
                      href={feedback.metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-retro-blue hover:underline"
                    >
                      {feedback.metadata.url}
                    </a>
                  </div>
                )}
                {feedback.metadata.screenWidth && feedback.metadata.screenHeight && (
                  <div className="flex items-center gap-2">
                    <Icon name="solar:monitor-linear" size={14} className="text-stone-400" />
                    <span className="text-stone-600">
                      {feedback.metadata.screenWidth} × {feedback.metadata.screenHeight}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Icon name="solar:calendar-linear" size={14} className="text-stone-400" />
                  <span className="text-stone-600">
                    {new Date(feedback.metadata.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Screenshot */}
      {feedback.screenshotUrl && (
        <div>
          <ScreenshotViewer url={feedback.screenshotUrl} />
        </div>
      )}

      {/* Video */}
      {feedback.recordingUrl && (
        <div>
          <VideoPlayer url={feedback.recordingUrl} duration={feedback.recordingDuration} />
        </div>
      )}
    </div>
  );
}
