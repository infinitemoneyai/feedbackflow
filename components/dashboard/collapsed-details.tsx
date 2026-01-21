"use client";

import { useState } from "react";
import { ChevronDown, Globe, Monitor, Clock, Mail, User, ExternalLink, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsedDetailsProps {
  metadata: {
    browser?: string;
    os?: string;
    url?: string;
    screenWidth?: number;
    screenHeight?: number;
    userAgent?: string;
    timestamp: number;
  };
  submitterName?: string;
  submitterEmail?: string;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CollapsedDetails({ metadata, submitterName, submitterEmail }: CollapsedDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDeviceIcon = () => {
    const isMobile =
      metadata.userAgent?.toLowerCase().includes("mobile") ||
      metadata.userAgent?.toLowerCase().includes("android") ||
      metadata.userAgent?.toLowerCase().includes("iphone");
    return isMobile ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />;
  };

  // Compact summary line
  const summaryParts = [];
  if (submitterName || submitterEmail) {
    summaryParts.push(submitterName || submitterEmail);
  }
  if (metadata.browser) {
    summaryParts.push(metadata.browser);
  }

  return (
    <div className="rounded border-2 border-stone-200 bg-stone-50">
      {/* Collapsed header - clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-stone-100"
      >
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <span className="text-stone-400">ⓘ</span>
          <span className="truncate">{summaryParts.join(" • ") || "Additional details"}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-stone-400 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-4 border-t border-stone-200 p-3">
          {/* Submitter info */}
          {(submitterName || submitterEmail) && (
            <div>
              <h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Submitter
              </h4>
              <div className="space-y-1.5 text-sm">
                {submitterName && (
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-stone-400" />
                    <span className="text-stone-600">{submitterName}</span>
                  </div>
                )}
                {submitterEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-stone-400" />
                    <a
                      href={`mailto:${submitterEmail}`}
                      className="text-retro-blue hover:underline"
                    >
                      {submitterEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div>
            <h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Technical Details
            </h4>
            <div className="space-y-1.5 text-sm">
              {metadata.url && (
                <div className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
                  <a
                    href={metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 truncate text-retro-blue hover:underline"
                  >
                    <span className="truncate">{metadata.url}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              )}
              {metadata.browser && (
                <div className="flex items-center gap-2">
                  {getDeviceIcon()}
                  <span className="text-stone-600">{metadata.browser}</span>
                </div>
              )}
              {metadata.os && (
                <div className="flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5 text-stone-400" />
                  <span className="text-stone-600">{metadata.os}</span>
                </div>
              )}
              {metadata.screenWidth && metadata.screenHeight && (
                <div className="flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5 text-stone-400" />
                  <span className="text-stone-600">
                    {metadata.screenWidth} × {metadata.screenHeight}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                <span className="text-stone-600">{formatDate(metadata.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
