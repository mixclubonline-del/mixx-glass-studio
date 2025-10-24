/**
 * Studio Core Module
 * Exports all core engine functionality
 * Note: Master Clock functionality now lives in Prime Brain
 */

export {
  StudioEngine,
  createStudioEngine,
  type PlaybackState,
  type TransportPosition,
  type PlaybackEvent,
  type PlaybackEventType,
  type PlaybackEventListener,
} from './audioEngine';
