import { useMemo } from "react";

export type TimelineTool = "select" | "move" | "trim" | "split";

export const TIMELINE_TOOLS: Array<{ id: TimelineTool; label: string; shortcut: string }> = [
  { id: "select", label: "Select", shortcut: "1" },
  { id: "move", label: "Move", shortcut: "2" },
  { id: "trim", label: "Trim", shortcut: "3" },
  { id: "split", label: "Split", shortcut: "4" },
];

export const DEFAULT_TIMELINE_TOOL: TimelineTool = "select";

export interface UseTimelineToolsOptions {
  /** Current active tool */
  activeTool: TimelineTool;
  /** Optional overrides for tool palette ordering */
  tools?: TimelineTool[];
}

/**
 * Returns a memoized palette of tools with metadata for UI rendering.
 */
export function useTimelineToolPalette(options: UseTimelineToolsOptions) {
  const { activeTool, tools = TIMELINE_TOOLS.map((tool) => tool.id) } = options;
  return useMemo(() => {
    return TIMELINE_TOOLS.filter((tool) => tools.includes(tool.id)).map((tool) => ({
      ...tool,
      active: tool.id === activeTool,
    }));
  }, [activeTool, tools]);
}

export function isTrimTool(tool: TimelineTool) {
  return tool === "trim";
}

export function isMoveTool(tool: TimelineTool) {
  return tool === "move";
}

export function isSplitTool(tool: TimelineTool) {
  return tool === "split";
}

export function isSelectTool(tool: TimelineTool) {
  return tool === "select";
}

export function getToolFromShortcut(key: string): TimelineTool | null {
  switch (key) {
    case "1":
      return "select";
    case "2":
      return "move";
    case "3":
      return "trim";
    case "4":
      return "split";
    default:
      return null;
  }
}

