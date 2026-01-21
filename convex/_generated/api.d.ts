/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as aiActions from "../aiActions.js";
import type * as analytics from "../analytics.js";
import type * as apiKeys from "../apiKeys.js";
import type * as automationActions from "../automationActions.js";
import type * as automationRules from "../automationRules.js";
import type * as billing from "../billing.js";
import type * as exportTemplates from "../exportTemplates.js";
import type * as feedback from "../feedback.js";
import type * as gdpr from "../gdpr.js";
import type * as integrations from "../integrations.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as projects from "../projects.js";
import type * as restApiKeys from "../restApiKeys.js";
import type * as storageConfig from "../storageConfig.js";
import type * as submitterPortal from "../submitterPortal.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";
import type * as webhookActions from "../webhookActions.js";
import type * as webhooks from "../webhooks.js";
import type * as widgetConfig from "../widgetConfig.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiActions: typeof aiActions;
  analytics: typeof analytics;
  apiKeys: typeof apiKeys;
  automationActions: typeof automationActions;
  automationRules: typeof automationRules;
  billing: typeof billing;
  exportTemplates: typeof exportTemplates;
  feedback: typeof feedback;
  gdpr: typeof gdpr;
  integrations: typeof integrations;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  projects: typeof projects;
  restApiKeys: typeof restApiKeys;
  storageConfig: typeof storageConfig;
  submitterPortal: typeof submitterPortal;
  teams: typeof teams;
  users: typeof users;
  webhookActions: typeof webhookActions;
  webhooks: typeof webhooks;
  widgetConfig: typeof widgetConfig;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
