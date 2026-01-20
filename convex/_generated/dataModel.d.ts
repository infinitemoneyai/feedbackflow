/**
 * Auto-generated Convex data model.
 * This file is a stub until `npx convex dev` is run.
 */

import { DataModelFromSchemaDefinition, GenericId } from "convex/server";
import schema from "../schema";

export type DataModel = DataModelFromSchemaDefinition<typeof schema>;

export type TableNames = keyof DataModel;

export type Id<TableName extends TableNames> = GenericId<TableName>;
