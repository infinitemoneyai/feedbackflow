import { ReactNode } from "react";

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlight matching search terms in text
 * Returns ReactNode with <mark> elements wrapping matched terms
 */
export function highlightText(text: string, searchQuery: string): ReactNode {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return text;
  }

  const terms = searchQuery.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
  if (terms.length === 0) {
    return text;
  }

  // Create a regex pattern that matches any of the search terms (case-insensitive)
  const pattern = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = terms.some((term) => part.toLowerCase() === term);
    if (isMatch) {
      return (
        <mark
          key={index}
          className="bg-retro-yellow/40 text-retro-black rounded px-0.5"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

/**
 * Format a timestamp as a human-readable time ago string
 */
export function formatTimeAgo(timestamp: number, now: number): string {
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export const priorityColors = {
  low: "border-stone-200 bg-stone-100 text-stone-500",
  medium: "border-retro-peach/20 bg-retro-peach/10 text-retro-peach",
  high: "border-retro-red/20 bg-retro-red/10 text-retro-red",
  critical: "border-retro-red bg-retro-red/20 text-retro-red",
};
