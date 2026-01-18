/**
 * MCP Tool Definitions (Core)
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "get_context",
    description: "Load system instructions and list of items. Call first.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "list_items",
    description: "List all stored item IDs.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "read_item",
    description: "Read an item JSON by ID.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Item ID" }
      },
      required: ["key"]
    }
  },
  {
    name: "save_item",
    description: "Create or replace an item. Use patch_item for small changes.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Item ID" },
        data: { type: "object", description: "Complete item JSON" }
      },
      required: ["key", "data"]
    }
  },
  {
    name: "patch_item",
    description: "Update specific fields using dot-notation paths.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Item ID" },
        updates: {
          type: "object",
          description: "Dot-notation paths: {'meta.status': 'value'}"
        }
      },
      required: ["key", "updates"]
    }
  },
  {
    name: "delete_item",
    description: "Delete an item by ID.",
    inputSchema: {
      type: "object",
      properties: { key: { type: "string" } },
      required: ["key"]
    }
  }
];
