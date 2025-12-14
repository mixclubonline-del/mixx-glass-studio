# Framer Motion Replacement Progress

## Phase 6: Animation Migration

### Completed Components

#### Core Animation Infrastructure
- ✅ `useAnimatePresence` hook and `AnimatePresence` component
- ✅ `usePulseAnimation` hook for repeating animations
- ✅ Enhanced `useFlowMotion` with pulse support

#### Mixer Components (Critical)
- ✅ `FlowMasterStrip.tsx` - All motion components replaced
- ✅ `FlowChannelStrip.tsx` - All motion components replaced (including actionPulse, picker animations)

### Remaining Files (23 files)

#### High Priority
- `src/components/mixer/FlowConsoleHeader.tsx` (4 motion components)
- `src/components/mixer/FlowConsoleMatrixView.tsx` (9 motion components)
- `src/components/mixer/FlowConsoleCompactView.tsx`
- `src/components/mixer/FlowConsoleAnalyzerView.tsx`
- `src/components/mixer/FlowBusStrip.tsx`

#### Medium Priority (Plugin Components)
- `src/plugins/external/components/PluginBrowser.tsx`
- `src/plugins/external/components/SidePanel.tsx`
- `src/plugins/external/components/RoutingView.tsx`
- `src/plugins/external/components/HaloSchematic.tsx`
- `src/plugins/external/components/SettingsPanel.tsx`
- `src/plugins/external/components/shared/ResizableContainer.tsx`
- `src/plugins/external/components/shared/AmbientBackground.tsx`
- `src/plugins/external/components/plugins/TelemetryCollector.tsx`
- `src/plugins/suite/components/PluginBrowser.tsx`
- `src/plugins/suite/components/SidePanel.tsx`
- `src/plugins/suite/SuitePluginSurface.tsx`
- `src/plugins/suite/components/shared/ResizableContainer.tsx`
- `src/plugins/suite/components/plugins/TelemetryCollector.tsx`

#### Low Priority
- `src/components/modals/StemSeparationModal.tsx`
- `src/components/mixer/FlowMeter.tsx`
- `src/components/mixer/FlowFader.tsx`
- `src/components/import/ImportInspector.tsx`

### Migration Pattern

For each file:

1. Replace `import { motion } from 'framer-motion'` with:
   ```typescript
   import { useFlowMotion, usePulseAnimation } from '../mixxglass';
   ```

2. Replace `motion.div` with regular `div` + `useFlowMotion`:
   ```typescript
   // Before
   <motion.div
     animate={{ opacity: 1, scale: 1 }}
     transition={{ duration: 300 }}
   >
   
   // After
   const style = useFlowMotion({ opacity: 1, scale: 1 }, { duration: 300 });
   <div style={style}>
   ```

3. Replace repeating animations with `usePulseAnimation`:
   ```typescript
   // Before
   <motion.div
     animate={{ opacity: [0.6, 1, 0.6] }}
     transition={{ duration: 1.4, repeat: Infinity }}
   />
   
   // After
   const pulseOpacity = usePulseAnimation(0.6, 1, 1400, 'ease-in-out');
   <div style={{ opacity: pulseOpacity }} />
   ```

4. Replace `AnimatePresence` with custom `AnimatePresence`:
   ```typescript
   // Before
   import { AnimatePresence } from 'framer-motion';
   
   // After
   import { AnimatePresence } from '../mixxglass';
   ```

### Next Steps

1. Continue migrating console views (FlowConsoleHeader, FlowConsoleMatrixView)
2. Migrate plugin components in batches
3. Remove `framer-motion` from `package.json` once all files are migrated
4. Verify all animations work correctly

### Notes

- Critical mixer components are complete
- Remaining files can be migrated incrementally
- All new animation infrastructure is in place
- No breaking changes to existing functionality


