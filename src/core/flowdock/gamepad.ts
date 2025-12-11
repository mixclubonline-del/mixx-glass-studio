/**
 * Gamepad (MPC-Style) Integration
 * 
 * Maps gamepad buttons to Flow Dock actions.
 * Supports MPC-style pad triggering and transport control.
 */

import type { DockMode } from "./types";

export interface GamepadMapping {
  button: number;
  action: string;
  mode?: DockMode; // Mode-specific mapping
}

// Default MPC-style mappings
const DEFAULT_MAPPINGS: GamepadMapping[] = [
  { button: 0, action: "play" }, // A button
  { button: 1, action: "stop" }, // B button
  { button: 2, action: "record" }, // X button
  { button: 3, action: "undo" }, // Y button
  { button: 4, action: "split" }, // Left bumper
  { button: 5, action: "trim" }, // Right bumper
  { button: 6, action: "zoomOut" }, // Left trigger
  { button: 7, action: "zoomIn" }, // Right trigger
  { button: 8, action: "toggleDock" }, // Back/Select
  { button: 9, action: "modeOverride" }, // Start
];

let gamepadConnected = false;
let activeGamepad: Gamepad | null = null;
let buttonStates: boolean[] = [];

/**
 * Initialize gamepad support
 */
export function initGamepad(): void {
  if (typeof navigator === "undefined" || !navigator.getGamepads) {
    return;
  }
  
  window.addEventListener("gamepadconnected", handleGamepadConnected);
  window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
  
  // Check for already connected gamepads
  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      handleGamepadConnected({ gamepad: gamepads[i]! } as GamepadEvent);
      break;
    }
  }
}

/**
 * Handle gamepad connection
 */
function handleGamepadConnected(e: GamepadEvent): void {
  activeGamepad = e.gamepad;
  gamepadConnected = true;
  buttonStates = new Array(activeGamepad.buttons.length).fill(false);
}

/**
 * Handle gamepad disconnection
 */
function handleGamepadDisconnected(): void {
  activeGamepad = null;
  gamepadConnected = false;
  buttonStates = [];
}

/**
 * Poll gamepad state and trigger actions
 */
export function pollGamepad(mappings: GamepadMapping[] = DEFAULT_MAPPINGS): string[] {
  if (!gamepadConnected || !activeGamepad) return [];
  
  const gamepad = navigator.getGamepads()[activeGamepad.index];
  if (!gamepad) return [];
  
  const triggeredActions: string[] = [];
  
  gamepad.buttons.forEach((button, index) => {
    const wasPressed = buttonStates[index];
    const isPressed = button.pressed;
    
    // Detect button press (not hold)
    if (isPressed && !wasPressed) {
      const mapping = mappings.find((m) => m.button === index);
      if (mapping) {
        triggeredActions.push(mapping.action);
      }
    }
    
    buttonStates[index] = isPressed;
  });
  
  return triggeredActions;
}

/**
 * Get gamepad connection state
 */
export function isGamepadConnected(): boolean {
  return gamepadConnected;
}

/**
 * Cleanup gamepad listeners
 */
export function cleanupGamepad(): void {
  window.removeEventListener("gamepadconnected", handleGamepadConnected);
  window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected);
}

