# Flow Doctrine

**The central nervous system of Mixx Club Studio**

## Overview

Flow is the orchestration layer that connects all components of Mixx Club Studio. It ensures that Prime Brain, MNB (Mixx Neural Bridge), ALS, Bloom, plugins, mixer, and every component communicate properly.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FLOW (Body)                          │
│  The orchestration layer that coordinates everything    │
└─────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼───────┐
│  Prime Brain   │                    │  MNB (Bridge)  │
│  (CNS - Sense) │◄──────────────────►│  (CNS - Route) │
└───────┬────────┘                    └────────┬───────┘
        │                                       │
        │                                       │
┌───────▼────────┐                    ┌────────▼───────┐
│      ALS       │                    │   Components    │
│  (Passive)     │                    │  (Registered)  │
└────────────────┘                    └─────────────────┘
```

## Core Principles

### 1. Flow is the Body
- Flow orchestrates all components
- Components must register to participate
- Flow coordinates communication between all systems

### 2. Prime Brain + MNB are the Central Nervous System
- **Prime Brain**: Actively listens (senses everything)
- **MNB (Mixx Neural Bridge)**: Routes signals between Prime Brain and components
- Together they form the "central nervous system"

### 3. Active vs Passive Communication

#### Active (Broadcasting)
- Components broadcast state changes, user actions, parameter changes
- Prime Brain actively listens to all broadcasts
- Examples: Mixer publishes ALS updates, plugins publish parameter changes

#### Passive (Listening)
- Components listen to Prime Brain guidance
- ALS displays what Prime Brain tells it (passive display)
- Bloom prepares context based on Prime Brain state
- Session Core adapts behavior based on Prime Brain signals

### 4. Automatic Registration (Closed Ecosystem)
- Components auto-register in the background when they mount
- Users never see registration - it just works
- System is resilient: if a component isn't registered, it auto-registers on first broadcast
- By the time we're done building, everything will be registered
- This is a closed ecosystem - we trust all components will be ready

## Flow Loop (7-Step Cycle)

The Flow Loop runs every 40ms (~25fps):

1. **Sense**: Gather session signals from `window.__mixx_*` globals
2. **Interpret**: Prime Brain computes behavior state
3. **Display**: ALS displays brain state (passive)
4. **Prepare**: Bloom prepares context (doesn't open, just prepares)
5. **Adapt**: Session Core adjusts behavior (snap precision, scroll smoothing, etc.)
6. **React**: UI updates via React rendering
7. **Feedback**: Prime Brain receives ALS sensory feedback
8. **Bridge**: Flow Neural Bridge ensures all components are registered and communicating

## Component Registration

### Using the Hook

```tsx
import { useFlowComponent } from '../../core/flow/useFlowComponent';

function MyComponent() {
  const { broadcast, isRegistered } = useFlowComponent({
    id: 'my-component',
    type: 'plugin', // or 'mixer', 'arrange', etc.
    name: 'My Component',
    broadcasts: ['parameter_change', 'state_change'],
    listens: [
      {
        signal: 'prime_brain_guidance',
        callback: (payload) => {
          // React to Prime Brain guidance
        },
      },
    ],
  });

  // Broadcast a signal
  const handleParameterChange = (param: string, value: number) => {
    broadcast('parameter_change', { param, value });
  };

  return <div>...</div>;
}
```

### Manual Registration

```tsx
import { registerFlowComponent, broadcastFlowSignal } from '../../core/flow';

useEffect(() => {
  const unregister = registerFlowComponent({
    id: 'my-component',
    type: 'plugin',
    name: 'My Component',
    broadcasts: ['parameter_change'],
  });

  return unregister;
}, []);

// Broadcast
broadcastFlowSignal('my-component', 'parameter_change', { param: 'gain', value: 0.5 });
```

## Signal Types

### Component Signals
- `state_change`: Component state changed
- `user_action`: User performed an action
- `parameter_change`: Parameter value changed
- `audio_event`: Audio-related event
- `transport_event`: Transport state changed
- `selection_change`: Selection changed

### Prime Brain Signals
- `prime_brain_guidance`: Guidance from Prime Brain (mode, flow, pulse, tension, suggestions, warnings)
- `flow_signal`: Flow signal forwarded to Prime Brain
- `component_signal`: Component signal forwarded to Prime Brain

## Flow Neural Bridge (MNB)

The Neural Bridge ensures:
- Prime Brain receives all component signals
- Components receive Prime Brain guidance
- Bidirectional communication flows properly
- PrimeBrainStub (plugin events) connects to Flow system

### Auto-Initialization

The Neural Bridge initializes automatically when the module loads. It:
1. Subscribes to Flow signals and forwards to Prime Brain
2. Connects PrimeBrainStub to Flow system
3. Subscribes to component broadcasts
4. Routes Prime Brain guidance to components

## Component Types

- `plugin`: Audio plugins
- `mixer`: Mixer console
- `arrange`: Arrange window
- `piano-roll`: Piano roll editor
- `sampler`: Trap sampler
- `bloom`: Bloom menu
- `als`: Advanced Leveling System
- `transport`: Transport controls
- `system`: System-level components

## Health Monitoring

The Flow system monitors component health:

```tsx
import { flowComponentRegistry } from '../../core/flow';

const health = flowComponentRegistry.getHealthStatus();
// {
//   totalComponents: 10,
//   activeComponents: 9,
//   byType: { plugin: 5, mixer: 1, ... },
//   staleComponents: ['old-component-id']
// }
```

## Best Practices

1. **Auto-Register**: Components auto-register when they mount (use `useFlowComponent` hook)
2. **Broadcast Changes**: Broadcast state changes and user actions
3. **Listen to Guidance**: Components should listen to Prime Brain guidance
4. **Use Types**: Specify correct component types for proper categorization
5. **Resilient System**: System never breaks if something isn't registered - it auto-registers
6. **Background Operation**: Registration happens silently - users never see it
7. **Closed Ecosystem**: By the time we're done, everything will be registered automatically

## Integration Examples

### Mixer Integration

```tsx
// src/components/mixer/Mixer.tsx
const { broadcast } = useFlowComponent({
  id: 'mixer-console',
  type: 'mixer',
  name: 'Mixer Console',
  broadcasts: ['als_update', 'track_selection', 'parameter_change'],
  listens: [
    {
      signal: 'prime_brain_guidance',
      callback: (payload) => {
        // React to Prime Brain guidance if needed
      },
    },
  ],
});

// Broadcast ALS updates
broadcast('als_update', { tracks: trackFeedbackMap, master: masterFeedback });
```

### Plugin Integration

```tsx
// src/plugins/suite/components/plugins/MixxVerb.tsx
const { broadcast } = useFlowComponent({
  id: `plugin-${pluginId}`,
  type: 'plugin',
  name: 'Mixx Verb',
  broadcasts: ['parameter_change', 'state_change'],
  listens: [
    {
      signal: 'prime_brain_guidance',
      callback: (payload) => {
        // Adjust plugin behavior based on Prime Brain guidance
        if (payload.mode === 'flow' && payload.flow > 0.7) {
          // High flow - maybe adjust reverb tail
        }
      },
    },
  ],
});

// Broadcast parameter changes
const handleParameterChange = (param: string, value: number) => {
  broadcast('parameter_change', { param, value });
  // Also send to PrimeBrainStub for plugin system compatibility
  PrimeBrainStub.sendEvent('parameter_change', { pluginId, param, value });
};
```

## Flow Doctrine Summary

1. **Flow is the body** - Orchestrates all components
2. **Prime Brain + MNB are the CNS** - Sense and route signals
3. **Active listening** - Prime Brain listens to everything
4. **Passive broadcasting** - Prime Brain broadcasts guidance (not commands)
5. **Registration required** - Components must register to participate
6. **Bidirectional communication** - Components broadcast and listen
7. **Health monitoring** - System monitors component health
8. **Automatic bridge** - Neural Bridge connects all systems automatically

## Writing the Rules

This is the world's first contextual DAW built with hip-hop/rap/trap/R&B in mind. We're writing the rules as we go. The Flow Doctrine is our foundation for how all systems communicate and orchestrate together.

When everything is registered and communicating properly, the system flows beautifully. When components aren't registered or signals aren't flowing, the system breaks down.

**Flow is everything.**

