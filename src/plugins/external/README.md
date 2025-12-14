# External Plugin System

This directory contains the external plugin system from https://github.com/mixclubonline-del/Mix-plug-ins.git, copied for comparison and potential integration.

## Structure

- `components/` - All plugin UI components
- `constants.ts` - Plugin definitions and tiers
- `types.ts` - TypeScript type definitions
- `hooks/` - React hooks (MIDI, presets, audio simulation)
- `lib/` - Utility libraries
- `adapters/` - Adapters to bridge with current Studio system

## Key Features

1. **VST Bridge Architecture** - Sophisticated audio processing bridge
2. **Global Settings** - Centralized UI/UX control
3. **AI Recommendations** - Built-in suggestion system
4. **Complete Plugin Set** - All plugins have full implementations
5. **Better Type Safety** - More specific settings interfaces

## Integration Status

**Current Phase:** Non-destructive exploration

- ✅ System copied and available
- ✅ Adapter layer created
- ⏳ Feature flag system (pending)
- ⏳ Full integration (pending)

## Usage

To test the external system:

1. Enable feature flag (when implemented)
2. Use adapter layer to bridge with audio engines
3. Compare with current system in `src/plugins/suite/`

See `docs/prototypes/external-plugin-system-integration.md` for full integration plan.









