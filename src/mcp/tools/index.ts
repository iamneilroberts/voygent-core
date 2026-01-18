/**
 * MCP Tool Handlers - Core
 */

import type { McpToolHandler } from '../../types';
import { handleGetContext } from './context';
import {
  handleListItems,
  handleReadItem,
  handleSaveItem,
  handlePatchItem,
  handleDeleteItem
} from './items';

export const toolHandlers: Record<string, McpToolHandler> = {
  get_context: handleGetContext,
  list_items: handleListItems,
  read_item: handleReadItem,
  save_item: handleSaveItem,
  patch_item: handlePatchItem,
  delete_item: handleDeleteItem
};

export {
  handleGetContext,
  handleListItems,
  handleReadItem,
  handleSaveItem,
  handlePatchItem,
  handleDeleteItem
};
