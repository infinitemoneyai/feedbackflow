/**
 * Widget Config loader (ADR-0001)
 *
 * The dashboard is the single source of truth for Widget Config; installed
 * widgets fetch it at load. This module owns the whole precedence chain as
 * one ordered unit:
 *
 *   fetched config (authoritative)
 *     → sessionStorage cache (instant same-session renders)
 *       → data attributes (fallback while pending/failed)
 *         → DEFAULT_CONFIG
 *
 * The fetch is bounded by a timeout so a config outage can never keep the
 * Launcher off the page — the failure mode equals the old snippet-baked
 * behavior.
 */

import type { WidgetConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { debug } from "./debug";

export const CONFIG_FETCH_TIMEOUT_MS = 3000;

const CACHE_PREFIX = "ff-widget-config:";

/** The config fields the dashboard owns and the endpoint serves. */
type FetchedConfig = Partial<
  Pick<
    WidgetConfig,
    | "position"
    | "buttonText"
    | "primaryColor"
    | "backgroundColor"
    | "textColor"
    | "logoUrl"
    | "displayMode"
  >
>;

const FETCHED_FIELDS = [
  "position",
  "buttonText",
  "primaryColor",
  "backgroundColor",
  "textColor",
  "logoUrl",
  "displayMode",
] as const;

/**
 * Derive the config endpoint from the submit API URL's origin
 * (data-api-url is part of every embed snippet).
 */
export function resolveConfigEndpoint(
  apiUrl: string | undefined
): string | null {
  if (!apiUrl) {
    return null;
  }
  try {
    const url = new URL(apiUrl);
    return `${url.origin}/api/widget/config`;
  } catch {
    return null;
  }
}

function cacheKey(widgetKey: string): string {
  return `${CACHE_PREFIX}${widgetKey}`;
}

function readCache(widgetKey: string): FetchedConfig | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(widgetKey));
    return raw ? (JSON.parse(raw) as FetchedConfig) : null;
  } catch {
    return null;
  }
}

function writeCache(widgetKey: string, config: FetchedConfig): void {
  try {
    sessionStorage.setItem(cacheKey(widgetKey), JSON.stringify(config));
  } catch {
    // Storage unavailable (private mode, quota) — cache is best-effort
  }
}

async function fetchConfig(
  endpoint: string,
  widgetKey: string
): Promise<FetchedConfig | null> {
  const response = await fetch(
    `${endpoint}?key=${encodeURIComponent(widgetKey)}`
  );
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { config?: Record<string, unknown> };
  if (!data || typeof data.config !== "object" || data.config === null) {
    return null;
  }

  const fetched: Record<string, unknown> = {};
  for (const field of FETCHED_FIELDS) {
    const value = data.config[field];
    if (value !== undefined && value !== null) {
      fetched[field] = value;
    }
  }
  return fetched as FetchedConfig;
}

function fetchAndCache(
  endpoint: string,
  widgetKey: string
): Promise<FetchedConfig | null> {
  return fetchConfig(endpoint, widgetKey).then((fetched) => {
    if (fetched) {
      writeCache(widgetKey, fetched);
    }
    return fetched;
  });
}

export interface LoadWidgetConfigOptions {
  widgetKey: string;
  /** Config parsed from script data attributes (or passed to init()). */
  dataAttrConfig: Partial<WidgetConfig>;
  timeoutMs?: number;
}

/**
 * Resolve the Widget Config an instance should render with.
 * Never rejects — every failure path degrades to data attributes/defaults.
 */
export async function loadWidgetConfig(
  options: LoadWidgetConfigOptions
): Promise<WidgetConfig> {
  const {
    widgetKey,
    dataAttrConfig,
    timeoutMs = CONFIG_FETCH_TIMEOUT_MS,
  } = options;

  const fallback: WidgetConfig = {
    ...DEFAULT_CONFIG,
    ...dataAttrConfig,
    widgetKey,
  };

  const endpoint = resolveConfigEndpoint(fallback.apiUrl);
  if (!endpoint) {
    debug.warn("No API URL — skipping Widget Config fetch");
    return fallback;
  }

  const cached = readCache(widgetKey);
  if (cached) {
    // Last-known config renders instantly; refresh for the next page view
    fetchAndCache(endpoint, widgetKey).catch(() => {});
    return { ...fallback, ...cached };
  }

  try {
    const fetched = await Promise.race([
      fetchAndCache(endpoint, widgetKey),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
    if (fetched) {
      return { ...fallback, ...fetched };
    }
    debug.warn("Widget Config fetch timed out or empty — using fallback");
  } catch (error) {
    debug.warn("Widget Config fetch failed — using fallback", error);
  }
  return fallback;
}
