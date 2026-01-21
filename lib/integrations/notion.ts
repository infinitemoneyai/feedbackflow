import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  BlockObjectRequest,
} from "@notionhq/client/build/src/api-endpoints";

// Type for database/data_source object with the properties we need
interface DatabaseObject {
  object: "database" | "data_source";
  id: string;
  url: string;
  title: Array<{ plain_text: string }>;
  icon?: {
    type: "emoji" | "external" | "file";
    emoji?: string;
    external?: { url: string };
    file?: { url: string };
  } | null;
  properties: Record<
    string,
    {
      id: string;
      type: string;
    }
  >;
}

export interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface NotionProperty {
  id: string;
  name: string;
  type: string;
}

export interface NotionPage {
  id: string;
  url: string;
  title: string;
}

export interface CreatePageParams {
  databaseId: string;
  title: string;
  description: string;
  type: "bug" | "feature";
  priority: string;
  tags: string[];
  screenshotUrl?: string;
  recordingUrl?: string;
  metadata?: {
    browser?: string;
    os?: string;
    url?: string;
    screenWidth?: number;
    screenHeight?: number;
  };
  submitterName?: string;
  submitterEmail?: string;
  ticketDraft?: {
    title?: string;
    description: string;
    acceptanceCriteria?: string[];
    reproSteps?: string[];
    expectedBehavior?: string;
    actualBehavior?: string;
  };
}

/**
 * Test if a Notion API key is valid
 */
export async function testNotionConnection(apiKey: string): Promise<{
  valid: boolean;
  error?: string;
  botName?: string;
}> {
  try {
    const client = new Client({ auth: apiKey });
    const response = await client.users.me({});

    const botUser = response as { name?: string; type?: string };

    return {
      valid: true,
      botName: botUser.name || "Notion Integration",
    };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Failed to connect to Notion",
    };
  }
}

/**
 * Search for databases the integration has access to
 * Note: Uses Notion's new data_source filter (2025 API)
 */
export async function getNotionDatabases(
  apiKey: string
): Promise<NotionDatabase[]> {
  try {
    const client = new Client({ auth: apiKey });

    console.log("[notion] Searching for data sources...");
    
    // Search for data sources using the new API filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await client.search({
      filter: {
        value: "data_source",
        property: "object"
      } as any,
      page_size: 100,
    });

    console.log("[notion] Search returned", response.results.length, "results");

    const databases: NotionDatabase[] = [];

    for (const result of response.results) {
      // Check if this is a data_source object
      if (!("object" in result) || (result as { object: string }).object !== "data_source") continue;

      // Cast to our database type (data sources act like databases)
      const db = result as unknown as DatabaseObject;

      // Skip if no title property
      if (!db.title) continue;

      const title =
        db.title.length > 0 ? db.title[0].plain_text : "Untitled";

      let iconStr: string | undefined;
      if (db.icon) {
        if (db.icon.type === "emoji" && db.icon.emoji) {
          iconStr = db.icon.emoji;
        } else if (db.icon.type === "external" && db.icon.external) {
          iconStr = db.icon.external.url;
        } else if (db.icon.type === "file" && db.icon.file) {
          iconStr = db.icon.file.url;
        }
      }

      databases.push({
        id: db.id,
        title,
        url: db.url,
        icon: iconStr,
      });
    }

    console.log("[notion] Found", databases.length, "data sources");
    return databases;
  } catch (error) {
    console.error("[notion] Error fetching data sources:", error);
    throw error;
  }
}

/**
 * Get database properties/schema
 */
export async function getNotionDatabaseProperties(
  apiKey: string,
  databaseId: string
): Promise<NotionProperty[]> {
  const client = new Client({ auth: apiKey });

  const response = await client.databases.retrieve({ database_id: databaseId });
  // Cast to our database type
  const db = response as unknown as DatabaseObject;

  const properties: NotionProperty[] = [];

  if (db.properties) {
    for (const [name, prop] of Object.entries(db.properties)) {
      properties.push({
        id: prop.id,
        name,
        type: prop.type,
      });
    }
  }

  return properties;
}

/**
 * Map FeedbackFlow priority to Notion select value
 */
export function mapPriorityToNotion(priority: string): string {
  switch (priority) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "Medium";
  }
}

/**
 * Format feedback content as Notion blocks
 */
function formatContentAsBlocks(params: CreatePageParams): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  // Use ticket draft if available, otherwise use description
  if (params.ticketDraft) {
    // Description
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: { content: params.ticketDraft.description },
          },
        ],
      },
    });

    // Reproduction steps for bugs
    if (
      params.type === "bug" &&
      params.ticketDraft.reproSteps &&
      params.ticketDraft.reproSteps.length > 0
    ) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Steps to Reproduce" } }],
        },
      });

      params.ticketDraft.reproSteps.forEach((step) => {
        blocks.push({
          object: "block",
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: [{ type: "text", text: { content: step } }],
          },
        });
      });
    }

    // Expected behavior
    if (params.ticketDraft.expectedBehavior) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Expected Behavior" } }],
        },
      });
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { type: "text", text: { content: params.ticketDraft.expectedBehavior } },
          ],
        },
      });
    }

    // Actual behavior
    if (params.ticketDraft.actualBehavior) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Actual Behavior" } }],
        },
      });
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { type: "text", text: { content: params.ticketDraft.actualBehavior } },
          ],
        },
      });
    }

    // Acceptance criteria
    if (
      params.ticketDraft.acceptanceCriteria &&
      params.ticketDraft.acceptanceCriteria.length > 0
    ) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Acceptance Criteria" } }],
        },
      });

      params.ticketDraft.acceptanceCriteria.forEach((criterion) => {
        blocks.push({
          object: "block",
          type: "to_do",
          to_do: {
            rich_text: [{ type: "text", text: { content: criterion } }],
            checked: false,
          },
        });
      });
    }
  } else if (params.description) {
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: params.description } }],
      },
    });
  }

  // Divider before media
  if (params.screenshotUrl || params.recordingUrl) {
    blocks.push({
      object: "block",
      type: "divider",
      divider: {},
    });
  }

  // Screenshot
  if (params.screenshotUrl) {
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "Screenshot" } }],
      },
    });
    blocks.push({
      object: "block",
      type: "image",
      image: {
        type: "external",
        external: { url: params.screenshotUrl },
      },
    });
  }

  // Recording link
  if (params.recordingUrl) {
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "Recording" } }],
      },
    });
    blocks.push({
      object: "block",
      type: "bookmark",
      bookmark: {
        url: params.recordingUrl,
      },
    });
  }

  // Metadata section
  if (params.metadata && Object.keys(params.metadata).length > 0) {
    blocks.push({
      object: "block",
      type: "divider",
      divider: {},
    });

    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "Environment" } }],
      },
    });

    const metadataItems: string[] = [];
    if (params.metadata.url) metadataItems.push(`URL: ${params.metadata.url}`);
    if (params.metadata.browser)
      metadataItems.push(`Browser: ${params.metadata.browser}`);
    if (params.metadata.os) metadataItems.push(`OS: ${params.metadata.os}`);
    if (params.metadata.screenWidth && params.metadata.screenHeight) {
      metadataItems.push(
        `Screen: ${params.metadata.screenWidth}x${params.metadata.screenHeight}`
      );
    }

    metadataItems.forEach((item) => {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: item } }],
        },
      });
    });
  }

  // Submitter info
  if (params.submitterName || params.submitterEmail) {
    blocks.push({
      object: "block",
      type: "divider",
      divider: {},
    });

    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "Submitted by" } }],
      },
    });

    const submitterInfo: string[] = [];
    if (params.submitterName)
      submitterInfo.push(`Name: ${params.submitterName}`);
    if (params.submitterEmail)
      submitterInfo.push(`Email: ${params.submitterEmail}`);

    submitterInfo.forEach((item) => {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: item } }],
        },
      });
    });
  }

  // Tags
  if (params.tags && params.tags.length > 0) {
    blocks.push({
      object: "block",
      type: "divider",
      divider: {},
    });

    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "Tags" } }],
      },
    });

    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: params.tags.map((tag) => ({
          type: "text" as const,
          text: { content: `#${tag} ` },
          annotations: { code: true },
        })),
      },
    });
  }

  // Attribution
  blocks.push({
    object: "block",
    type: "divider",
    divider: {},
  });

  blocks.push({
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [
        {
          type: "text",
          text: {
            content: "Exported from ",
          },
          annotations: { italic: true, color: "gray" },
        },
        {
          type: "text",
          text: {
            content: "FeedbackFlow",
            link: { url: "https://feedbackflow.dev" },
          },
          annotations: { italic: true, color: "gray" },
        },
      ],
    },
  });

  return blocks;
}

/**
 * Create a page in a Notion database
 */
export async function createNotionPage(
  apiKey: string,
  params: CreatePageParams
): Promise<NotionPage> {
  const client = new Client({ auth: apiKey });

  // Get database properties to determine what properties are available
  const dbProperties = await getNotionDatabaseProperties(apiKey, params.databaseId);
  const propertyNames = dbProperties.map((p) => p.name.toLowerCase());

  // Build properties based on what's available in the database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {};

  // Title is required - find the title property
  const titleProp = dbProperties.find((p) => p.type === "title");
  if (titleProp) {
    properties[titleProp.name] = {
      title: [
        {
          text: {
            content: params.ticketDraft?.title || params.title,
          },
        },
      ],
    };
  }

  // Type - check for select property named "type" or "Type"
  const typePropName = propertyNames.includes("type")
    ? dbProperties.find((p) => p.name.toLowerCase() === "type")?.name
    : null;
  if (typePropName) {
    properties[typePropName] = {
      select: {
        name: params.type === "bug" ? "Bug" : "Feature",
      },
    };
  }

  // Priority - check for select property named "priority" or "Priority"
  const priorityPropName = propertyNames.includes("priority")
    ? dbProperties.find((p) => p.name.toLowerCase() === "priority")?.name
    : null;
  if (priorityPropName) {
    properties[priorityPropName] = {
      select: {
        name: mapPriorityToNotion(params.priority),
      },
    };
  }

  // Status - check for select/status property named "status" or "Status"
  const statusPropName = propertyNames.includes("status")
    ? dbProperties.find((p) => p.name.toLowerCase() === "status")?.name
    : null;
  const statusProp = dbProperties.find((p) => p.name.toLowerCase() === "status");
  if (statusPropName && statusProp) {
    if (statusProp.type === "status") {
      properties[statusPropName] = {
        status: { name: "New" },
      };
    } else if (statusProp.type === "select") {
      properties[statusPropName] = {
        select: { name: "New" },
      };
    }
  }

  // Tags - check for multi_select property named "tags" or "Tags"
  const tagsPropName = propertyNames.includes("tags")
    ? dbProperties.find((p) => p.name.toLowerCase() === "tags")?.name
    : null;
  if (tagsPropName && params.tags && params.tags.length > 0) {
    properties[tagsPropName] = {
      multi_select: params.tags.map((tag) => ({ name: tag })),
    };
  }

  // URL - check for url property named "url" or "URL" or "Source URL"
  const urlPropName =
    dbProperties.find(
      (p) =>
        p.type === "url" &&
        (p.name.toLowerCase() === "url" ||
          p.name.toLowerCase() === "source url" ||
          p.name.toLowerCase() === "source")
    )?.name || null;
  if (urlPropName && params.metadata?.url) {
    properties[urlPropName] = {
      url: params.metadata.url,
    };
  }

  // Create the page with content blocks
  const contentBlocks = formatContentAsBlocks(params);

  const response = await client.pages.create({
    parent: { database_id: params.databaseId },
    properties,
    children: contentBlocks,
  });

  const page = response as PageObjectResponse;

  // Extract title from the response
  let pageTitle = params.ticketDraft?.title || params.title;
  if (page.properties) {
    for (const prop of Object.values(page.properties)) {
      if (prop.type === "title" && "title" in prop) {
        const titleArr = prop.title as Array<{ plain_text: string }>;
        if (titleArr.length > 0) {
          pageTitle = titleArr[0].plain_text;
        }
        break;
      }
    }
  }

  return {
    id: page.id,
    url: page.url,
    title: pageTitle,
  };
}

/**
 * Format feedback data for display (used for description preview)
 */
export function formatFeedbackForNotion(feedback: {
  title: string;
  description?: string;
  type: string;
  priority: string;
  screenshotUrl?: string;
  recordingUrl?: string;
  metadata?: {
    browser?: string;
    os?: string;
    url?: string;
    screenWidth?: number;
    screenHeight?: number;
  };
  submitterName?: string;
  submitterEmail?: string;
  tags?: string[];
  ticketDraft?: {
    description: string;
    acceptanceCriteria?: string[];
    reproSteps?: string[];
    expectedBehavior?: string;
    actualBehavior?: string;
  };
}): string {
  const sections: string[] = [];

  // Use ticket draft if available, otherwise use feedback description
  if (feedback.ticketDraft) {
    sections.push(feedback.ticketDraft.description);

    if (feedback.type === "bug" && feedback.ticketDraft.reproSteps?.length) {
      sections.push("\n## Steps to Reproduce");
      feedback.ticketDraft.reproSteps.forEach((step, i) => {
        sections.push(`${i + 1}. ${step}`);
      });
    }

    if (feedback.ticketDraft.expectedBehavior) {
      sections.push(
        `\n## Expected Behavior\n${feedback.ticketDraft.expectedBehavior}`
      );
    }

    if (feedback.ticketDraft.actualBehavior) {
      sections.push(
        `\n## Actual Behavior\n${feedback.ticketDraft.actualBehavior}`
      );
    }

    if (feedback.ticketDraft.acceptanceCriteria?.length) {
      sections.push("\n## Acceptance Criteria");
      feedback.ticketDraft.acceptanceCriteria.forEach((criterion) => {
        sections.push(`- [ ] ${criterion}`);
      });
    }
  } else if (feedback.description) {
    sections.push(feedback.description);
  }

  return sections.join("\n");
}
