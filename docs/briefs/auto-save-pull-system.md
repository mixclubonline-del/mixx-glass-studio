# Auto-Save and Auto-Pull System

## Overview

Complete automatic persistence and synchronization system for Mixx Club Studio, preserving Flow by eliminating manual save friction and keeping code in sync.

## Components

### 1. Auto-Save Service (`src/core/autosave/autoSaveService.ts`)

**What:** Automatic project state persistence with IndexedDB  
**Why:** Preserve Flow by eliminating manual save friction, reinforce Mixx Recall  
**How:** Periodic saves to IndexedDB with debouncing and recovery support

**Features:**
- Saves every 30 seconds (configurable)
- Debounces saves by 2 seconds after last change
- Keeps last 10 auto-saves for recovery
- Lightweight (excludes audio buffers for performance)
- Status callbacks for UI feedback

**Usage:**
```typescript
import { autoSaveService } from './core/autosave/autoSaveService';

// Initialize
await autoSaveService.initialize();

// Register state getter
autoSaveService.registerStateGetter(() => projectState);

// Enable/disable
autoSaveService.setEnabled(true);

// Manual save
autoSaveService.saveNow();

// Load latest
const latest = await autoSaveService.loadLatest();
```

### 2. Auto-Pull Service (`src/core/autosave/autoPullService.ts`)

**What:** Automatic git repository synchronization  
**Why:** Keep Flow by ensuring code stays in sync without manual intervention  
**How:** Periodic git pull operations via Tauri commands

**Features:**
- Pulls every 5 minutes (configurable)
- Checks for uncommitted changes before pulling
- Prevents conflicts by requiring clean working directory
- Status callbacks for UI feedback
- **Disabled by default** for safety

**Usage:**
```typescript
import { autoPullService } from './core/autosave/autoPullService';

// Initialize with Tauri command invoker
await autoPullService.initialize(invokeCommand);

// Enable/disable (disabled by default)
autoPullService.setEnabled(true);

// Set interval (in milliseconds)
autoPullService.setInterval(300000); // 5 minutes

// Manual pull
const result = await autoPullService.pullNow();

// Get git status
const status = await autoPullService.getGitStatus();
```

### 3. React Hooks

#### `useAutoSave` (`src/hooks/useAutoSave.ts`)

React hook that wraps auto-save service with reactive state.

```typescript
const autoSave = useAutoSave(getProjectState);

// Status
autoSave.status.isEnabled
autoSave.status.lastSaveTime
autoSave.status.pendingChanges
autoSave.status.saveInProgress

// Actions
autoSave.saveNow();
autoSave.setEnabled(true);
autoSave.loadLatest();
autoSave.getAllSaves();
```

#### `useAutoPull` (`src/hooks/useAutoPull.ts`)

React hook that wraps auto-pull service with reactive state and Tauri integration.

```typescript
const autoPull = useAutoPull();

// Status
autoPull.status.isEnabled
autoPull.status.lastPullTime
autoPull.status.pullInProgress
autoPull.status.lastError

// Actions
autoPull.pullNow();
autoPull.setEnabled(true);
autoPull.setInterval(300000);
autoPull.getGitStatus();
```

### 4. UI Component (`src/components/AutoSaveStatus.tsx`)

Visual indicator showing auto-save and auto-pull status with temperature-based colors:
- **Green:** Successfully saved/synced
- **Yellow:** Pending changes
- **Purple:** Save/pull in progress
- **Red:** Error state
- **Gray:** Disabled/never saved

Positioned in bottom-right corner, non-intrusive.

### 5. Tauri Git Commands (`src-tauri/src/git.rs`)

Rust backend commands for git operations:
- `git_status()` - Get repository status
- `git_pull()` - Pull latest changes
- `git_fetch()` - Fetch remote changes

## Integration

### In App.tsx

Auto-save is automatically integrated:
1. `getProjectState` function extracts current project state
2. `useAutoSave` hook initializes service
3. `useEffect` triggers saves on state changes
4. `AutoSaveStatus` component displays status

Auto-pull can be enabled via settings (disabled by default for safety).

## Configuration

### Auto-Save Settings

Stored in `localStorage` under `mixx-autosave-settings`:
```json
{
  "isEnabled": true
}
```

### Auto-Pull Settings

Stored in `localStorage` under `mixx-autopull-settings`:
```json
{
  "isEnabled": false,
  "interval": 300000
}
```

## Safety Features

1. **Auto-pull disabled by default** - Must be explicitly enabled
2. **Checks for uncommitted changes** - Won't pull if working directory is dirty
3. **Debounced saves** - Prevents excessive writes
4. **Limited history** - Only keeps last 10 auto-saves
5. **Error handling** - Graceful degradation on failures

## Data Persistence

### Auto-Save Storage

- **Location:** IndexedDB (`mixx-studio-autosave`)
- **Store:** `project-states`
- **Key:** `timestamp`
- **Retention:** Last 10 saves

### What's Saved

- Tracks and clips
- Mixer settings
- Master volume/balance
- BPM and transport state
- Automation data
- Musical context
- FX bypass states
- Bloom positions
- Ingest history
- Piano roll sketches

### What's NOT Saved (for performance)

- Audio buffers (too large for IndexedDB)
- Real-time analysis data
- Temporary UI state

## Recovery

To recover from auto-save:

```typescript
const autoSave = useAutoSave(getProjectState);
const latest = await autoSave.loadLatest();
// Apply latest state to restore project
```

## Keyboard Shortcuts

- **Cmd/Ctrl+S**: Manual save (downloads project file)
- **Cmd/Ctrl+Shift+S**: Open recovery modal

## Recovery UI

The `AutoSaveRecovery` component provides a modal interface to:
- View all auto-save history
- See save timestamps and relative times
- Preview save contents (track/clip counts, BPM, etc.)
- Restore any previous auto-save state

Access via keyboard shortcut or programmatically:
```typescript
setIsRecoveryOpen(true);
```

## Settings UI

The `AutoSaveSettings` component provides controls for:
- Enable/disable auto-save
- Enable/disable auto-pull
- View last save/pull times
- Manual pull trigger
- Error status display

## Future Enhancements

- [ ] Cloud sync integration
- [ ] Conflict resolution UI
- [ ] Selective restore (tracks only, mixer only, etc.)
- [ ] Export auto-saves to file
- [ ] Branch-aware auto-pull
- [ ] Stash before pull option
- [ ] Settings panel integration in Bloom Menu

---

**Status:** ✅ Complete and integrated  
**Last Updated:** 2025-11-28  
**Features Added:**
- ✅ Keyboard shortcuts (Cmd/Ctrl+S, Cmd/Ctrl+Shift+S)
- ✅ Recovery UI modal
- ✅ Settings UI component
- ✅ State restoration handler

