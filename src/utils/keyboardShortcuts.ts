type ShortcutHandler = (event: KeyboardEvent) => void;

export interface ShortcutConfig {
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  key: string;
  preventDefault?: boolean;
  description?: string;
}

interface RegisteredShortcut {
  id: string;
  config: ShortcutConfig;
  handler: ShortcutHandler;
}

const shortcuts: RegisteredShortcut[] = [];
let listenerAttached = false;

function matchesConfig(event: KeyboardEvent, config: ShortcutConfig) {
  const key = event.key.toLowerCase();
  const targetKey = config.key.toLowerCase();
  return (
    key === targetKey &&
    (!!config.meta === (event.metaKey || event.key === "Meta")) &&
    (!!config.ctrl === event.ctrlKey) &&
    (!!config.shift === event.shiftKey) &&
    (!!config.alt === event.altKey)
  );
}

function ensureListener() {
  if (listenerAttached || typeof window === "undefined") return;
  window.addEventListener("keydown", handleKeyDown, true);
  listenerAttached = true;
}

function detachListenerIfUnused() {
  if (!listenerAttached || typeof window === "undefined") return;
  if (shortcuts.length === 0) {
    window.removeEventListener("keydown", handleKeyDown, true);
    listenerAttached = false;
  }
}

function handleKeyDown(event: KeyboardEvent) {
  for (const shortcut of shortcuts) {
    if (matchesConfig(event, shortcut.config)) {
      if (shortcut.config.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.handler(event);
      break;
    }
  }
}

export function registerShortcut(id: string, config: ShortcutConfig, handler: ShortcutHandler) {
  shortcuts.push({ id, config, handler });
  ensureListener();
}

export function unregisterShortcut(id: string) {
  // Remove all shortcuts with this ID (not just the first) to handle duplicates
  let removed = false;
  for (let i = shortcuts.length - 1; i >= 0; i--) {
    if (shortcuts[i].id === id) {
      shortcuts.splice(i, 1);
      removed = true;
    }
  }
  if (removed) {
    detachListenerIfUnused();
  }
}

export function clearShortcuts() {
  shortcuts.splice(0, shortcuts.length);
  detachListenerIfUnused();
}

export function shortcutLabel(config: ShortcutConfig) {
  const parts = [];
  if (config.meta) parts.push("⌘");
  if (config.ctrl) parts.push("Ctrl");
  if (config.shift) parts.push("Shift");
  if (config.alt) parts.push("Alt");
  parts.push(config.key.toUpperCase());
  return parts.join(" + ");
}

