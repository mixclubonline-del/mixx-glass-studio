/**
 * MixxGlass Components - Main Export
 * 
 * Proprietary component library for MixClub Studio
 */

// Primitives
export { MixxGlassButton, type MixxGlassButtonProps } from './primitives/Button';
export { MixxGlassSlider, type MixxGlassSliderProps } from './primitives/Slider';
export { MixxGlassInput, type MixxGlassInputProps } from './primitives/Input';
export { MixxGlassToggle, type MixxGlassToggleProps } from './primitives/Toggle';

// DAW-Specific Components
export { MixxGlassFader, type MixxGlassFaderProps } from './daw-specific/Fader';
export { MixxGlassMeter, type MixxGlassMeterProps } from './daw-specific/Meter';
export { MixxGlassKnob, type MixxGlassKnobProps } from './daw-specific/Knob';

// Composite Components
export {
  MixxGlassDialog,
  MixxGlassDialogContent,
  MixxGlassDialogHeader,
  MixxGlassDialogTitle,
  MixxGlassDialogDescription,
  MixxGlassDialogFooter,
  type MixxGlassDialogProps,
} from './composite/Dialog';
export {
  MixxGlassDropdown,
  type MixxGlassDropdownProps,
  type MixxGlassDropdownItem,
} from './composite/Dropdown';

// Hooks
export { useALSFeedback, type UseALSFeedbackOptions } from './hooks/useALSFeedback';
export { useFlowMotion, useGlassTransform, usePulseAnimation, type FlowMotionConfig } from './hooks/useFlowMotion';
export { useAnimatePresence, AnimatePresence } from './hooks/useAnimatePresence';

// Utils
export { getGlassSurface, getGlassButtonStyles, getGlassInputStyles } from './utils/glassStyles';
export {
  alsChannelToColor,
  valueToTemperature,
  valueToEnergy,
  generateALSFeedback,
  type ALSChannel,
  type ALSFeedback,
} from './utils/alsHelpers';

