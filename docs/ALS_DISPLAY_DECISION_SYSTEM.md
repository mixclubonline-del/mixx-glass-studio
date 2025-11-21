# ALS Display Decision System

**Prime Brain's intelligent system for determining when to show text vs waveform in the ALS Header.**

## Overview

The ALS Header is an adaptive waveform that morphs into text when information is needed. Prime Brain makes all display decisions through the Flow system, ensuring information is never clutter and users never break flow.

## Architecture

```
Prime Brain (Decision Engine)
    ↓
Flow Neural Bridge (MNB)
    ↓
ALS Display Decision Signal
    ↓
ALS Header (Passive Display)
```

### Flow Doctrine

- **Prime Brain**: Makes decisions (active)
- **ALS Header**: Displays what Prime Brain tells it (passive)
- **Never clutter**: Only show text when information is pertinent
- **Never break flow**: User never needs to look away from work

## Decision Rules

### Rule 1: Waveform is Default
- Pure visual representation
- No text, no clutter
- Always the default state

### Rule 2: Text Appears Only When Information Is:

1. **Urgent** - Requires immediate attention
   - Hush active (noise detected)
   - System warnings
   - Critical errors

2. **Actionable** - User needs to do something
   - Recording ready (needs play button)
   - Mode transitions requiring attention
   - Setup required

3. **Contextual** - Relevant to current activity
   - During active playback
   - During recording
   - During editing sessions

4. **Time-Sensitive** - Will be missed if not shown now
   - Recent user action feedback
   - Mode changes
   - Significant state transitions

## Decision Engine

Located in: `src/core/loop/alsDisplayDecisionEngine.ts`

### Decision Priorities

- **urgent**: Must show immediately (hush, critical warnings)
- **high**: Important information (recording ready, warnings)
- **medium**: Contextual information (playback active, mode transitions)
- **low**: Brief feedback (recent actions, subtle changes)

### Decision Duration

- **undefined**: Show until condition changes (e.g., during playback)
- **number (ms)**: Show for specific duration then return to waveform

## Integration Points

### Components That Should Trigger Decisions

1. **Transport Events**
   - Play/Pause/Stop
   - Record start/stop
   - Loop toggle

2. **User Actions**
   - Clip selection
   - Track selection
   - Region movement
   - Parameter changes

3. **System Events**
   - Hush activation/deactivation
   - Noise detection
   - Mode changes
   - Flow state changes

4. **Audio Events**
   - Clip playing/stopped
   - Master level warnings
   - Clipping detection

### How to Add New Decision Triggers

1. **Add signal to decision engine**
   ```typescript
   // In alsDisplayDecisionEngine.ts
   export const DISPLAY_DECISION_OPPORTUNITIES = {
     YOUR_NEW_EVENT: 'your_new_event',
   };
   ```

2. **Add rule to computeALSDisplayDecision**
   ```typescript
   // Add new rule in computeALSDisplayDecision function
   if (context.yourNewCondition) {
     return {
       showText: true,
       priority: 'medium',
       reason: 'your_new_event',
       duration: 2000, // optional
     };
   }
   ```

3. **Broadcast signal from component**
   ```typescript
   // In your component
   const { broadcast } = useFlowComponent({...});
   
   broadcast('your_signal', { yourData });
   ```

4. **Map signal in decision engine**
   ```typescript
   // In mapSignalToDisplayTrigger
   case 'your_signal':
     return {
       yourNewCondition: payload.active,
       recentUserAction: true,
     };
   ```

## Current Decision Rules

### 1. Hush Active (URGENT)
- **Priority**: urgent
- **Duration**: undefined (until hush deactivates)
- **Reason**: Noise detected, requires immediate attention

### 2. Recording Ready (HIGH)
- **Priority**: high
- **Duration**: undefined (until recording starts or cancelled)
- **Reason**: User needs to know recording is ready

### 3. Playback Active (MEDIUM)
- **Priority**: medium
- **Duration**: undefined (until playback stops)
- **Reason**: Contextual information during playback

### 4. Recent Action Feedback (LOW)
- **Priority**: low
- **Duration**: 2000ms
- **Reason**: Brief feedback after user actions
- **Condition**: Only if meaningful information exists

### 5. Warnings Present (HIGH)
- **Priority**: high
- **Duration**: 3000ms
- **Reason**: Important warnings need attention
- **Condition**: Only if tension > 0.5

### 6. Mode Transitions (MEDIUM)
- **Priority**: medium
- **Duration**: 1500ms
- **Reason**: Significant mode changes
- **Condition**: Only for record/burst/punch modes

## Flow Signal: `als_display_decision`

### Signal Payload

```typescript
{
  showText: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  duration?: number; // ms, undefined = until condition changes
  information?: {
    mode?: string;
    guidance?: string;
    health?: string;
    warnings?: string[];
  };
}
```

### Listening to Decisions

```typescript
const { useFlowComponent } = require('../core/flow/useFlowComponent');

useFlowComponent({
  id: 'my-component',
  type: 'als',
  listens: [
    {
      signal: 'als_display_decision',
      callback: (payload) => {
        // React to Prime Brain's display decision
        const decision = payload;
        if (decision.showText) {
          // Text should be shown
        } else {
          // Waveform should be shown
        }
      },
    },
  ],
});
```

## Training the System

### Principles for Adding Rules

1. **Default to Waveform**
   - When in doubt, don't show text
   - Waveform is the default state

2. **Only Pertinent Information**
   - If user doesn't need to see it, don't show it
   - If it's not actionable, don't show it
   - If it's not urgent, consider not showing it

3. **Respect Flow**
   - Never interrupt user's creative flow
   - Brief, contextual information only
   - Auto-dismiss when no longer relevant

4. **Time-Sensitive Only**
   - If information can wait, don't show it now
   - If user can find it elsewhere, don't show it
   - If it's always visible, don't duplicate it

### Testing Decisions

1. **Check if text appears when it shouldn't**
   - Default should always be waveform
   - Text should only appear for specific reasons

2. **Check if text appears when it should**
   - Urgent events should show text
   - Actionable events should show text
   - Contextual events should show text

3. **Check timing**
   - Brief feedback should auto-dismiss
   - Ongoing events should persist
   - Transitions should be smooth

## Future Opportunities

### Potential Decision Triggers

1. **Plugin Events**
   - Plugin loaded/unloaded
   - Parameter automation active
   - Plugin warnings

2. **Mixer Events**
   - Track solo/mute
   - Bus routing changes
   - Master level warnings

3. **Arrangement Events**
   - Clip collisions
   - Timeline zoom changes
   - Snap mode changes

4. **AI Events**
   - Prime Brain recommendations
   - QNN analysis complete
   - Mix suggestions

5. **Performance Events**
   - CPU usage high
   - Buffer underruns
   - Memory warnings

## Summary

The ALS Display Decision System ensures:
- ✅ Waveform is always the default
- ✅ Text only appears when pertinent
- ✅ Prime Brain makes all decisions
- ✅ Users never break flow
- ✅ Information is never clutter
- ✅ System is trainable and extensible

**Flow is everything. Prime Brain decides. ALS displays.**


