/**
 * Dock Collapse/Expand Gesture
 * 
 * Allows users to collapse dock to minimal state or expand to full.
 * Supports mouse drag, touch gestures, and keyboard shortcuts.
 */

export type DockState = "expanded" | "collapsed" | "minimal";

export interface DockCollapseState {
  state: DockState;
  height: number;
  isTransitioning: boolean;
}

const EXPANDED_HEIGHT = 64; // px
const COLLAPSED_HEIGHT = 8; // px
const MINIMAL_HEIGHT = 4; // px

let dockState: DockState = "expanded";

/**
 * Get height for dock state
 */
export function getDockHeight(state: DockState): number {
  switch (state) {
    case "expanded":
      return EXPANDED_HEIGHT;
    case "collapsed":
      return COLLAPSED_HEIGHT;
    case "minimal":
      return MINIMAL_HEIGHT;
  }
}

/**
 * Toggle dock state
 */
export function toggleDockState(): DockState {
  switch (dockState) {
    case "expanded":
      dockState = "collapsed";
      break;
    case "collapsed":
      dockState = "minimal";
      break;
    case "minimal":
      dockState = "expanded";
      break;
  }
  return dockState;
}

/**
 * Set dock state
 */
export function setDockState(state: DockState): void {
  dockState = state;
}

/**
 * Get current dock state
 */
export function getDockState(): DockState {
  return dockState;
}

/**
 * Handle drag gesture for collapse/expand
 */
export function handleDockDrag(
  startY: number,
  currentY: number,
  threshold: number = 20
): DockState | null {
  const deltaY = startY - currentY;
  
  if (Math.abs(deltaY) < threshold) return null;
  
  if (deltaY > 0) {
    // Dragging up = collapse
    if (dockState === "expanded") {
      setDockState("collapsed");
      return "collapsed";
    }
    if (dockState === "collapsed") {
      setDockState("minimal");
      return "minimal";
    }
  } else {
    // Dragging down = expand
    if (dockState === "minimal") {
      setDockState("collapsed");
      return "collapsed";
    }
    if (dockState === "collapsed") {
      setDockState("expanded");
      return "expanded";
    }
  }
  
  return null;
}

