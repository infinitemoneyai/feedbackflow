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
import type * as ai_db_analysis from "../ai/db/analysis.js";
import type * as ai_db_config from "../ai/db/config.js";
import type * as ai_db_conversations from "../ai/db/conversations.js";
import type * as ai_db_helpers from "../ai/db/helpers.js";
import type * as ai_db_index from "../ai/db/index.js";
import type * as ai_db_solutions from "../ai/db/solutions.js";
import type * as ai_db_ticketDrafts from "../ai/db/ticketDrafts.js";
import type * as ai_index from "../ai/index.js";
import type * as ai_normalizers from "../ai/normalizers.js";
import type * as ai_prompts from "../ai/prompts.js";
import type * as ai_providers_anthropic from "../ai/providers/anthropic.js";
import type * as ai_providers_base from "../ai/providers/base.js";
import type * as ai_providers_index from "../ai/providers/index.js";
import type * as ai_providers_openai from "../ai/providers/openai.js";
import type * as ai_services_analysis from "../ai/services/analysis.js";
import type * as ai_services_conversation from "../ai/services/conversation.js";
import type * as ai_services_index from "../ai/services/index.js";
import type * as ai_services_solutions from "../ai/services/solutions.js";
import type * as ai_services_ticketDraft from "../ai/services/ticketDraft.js";
import type * as ai_types from "../ai/types.js";
import type * as ai_utils from "../ai/utils.js";
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
  "ai/db/analysis": typeof ai_db_analysis;
  "ai/db/config": typeof ai_db_config;
  "ai/db/conversations": typeof ai_db_conversations;
  "ai/db/helpers": typeof ai_db_helpers;
  "ai/db/index": typeof ai_db_index;
  "ai/db/solutions": typeof ai_db_solutions;
  "ai/db/ticketDrafts": typeof ai_db_ticketDrafts;
  "ai/index": typeof ai_index;
  "ai/normalizers": typeof ai_normalizers;
  "ai/prompts": typeof ai_prompts;
  "ai/providers/anthropic": typeof ai_providers_anthropic;
  "ai/providers/base": typeof ai_providers_base;
  "ai/providers/index": typeof ai_providers_index;
  "ai/providers/openai": typeof ai_providers_openai;
  "ai/services/analysis": typeof ai_services_analysis;
  "ai/services/conversation": typeof ai_services_conversation;
  "ai/services/index": typeof ai_services_index;
  "ai/services/solutions": typeof ai_services_solutions;
  "ai/services/ticketDraft": typeof ai_services_ticketDraft;
  "ai/types": typeof ai_types;
  "ai/utils": typeof ai_utils;
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
