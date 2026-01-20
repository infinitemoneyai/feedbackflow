/**
 * Auto-generated Convex server types.
 * This file will be overwritten when `npx convex dev` is run.
 */

import {
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  actionGeneric,
  mutationGeneric,
  queryGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  httpActionGeneric,
} from "convex/server";
import type { DataModel } from "./dataModel";

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;

export const query = queryGeneric;
export const mutation = mutationGeneric;
export const action = actionGeneric;
export const internalQuery = internalQueryGeneric;
export const internalMutation = internalMutationGeneric;
export const internalAction = internalActionGeneric;
export const httpAction = httpActionGeneric;
