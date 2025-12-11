/**
 * ALS Feedback Utility
 * 
 * Provides system message feedback through ALS instead of console.log
 * Follows Flow Doctrine: No raw numbers, only color/temperature/energy
 */

import { alsHelpers } from '../components/mixxglass/utils/alsHelpers';

export type ALSMessageLevel = 'info' | 'success' | 'warning' | 'error' | 'system';

export interface ALSMessage {
  level: ALSMessageLevel;
  message: string;
  channel: 'temperature' | 'momentum' | 'pressure' | 'harmony';
  intensity: number;
  timestamp: number;
}

/**
 * Convert message level to ALS channel and intensity
 */
function levelToALS(level: ALSMessageLevel): { channel: 'temperature' | 'momentum' | 'pressure' | 'harmony'; intensity: number } {
  switch (level) {
    case 'error':
      return { channel: 'pressure', intensity: 0.9 };
    case 'warning':
      return { channel: 'temperature', intensity: 0.7 };
    case 'success':
      return { channel: 'harmony', intensity: 0.6 };
    case 'info':
      return { channel: 'momentum', intensity: 0.4 };
    case 'system':
      return { channel: 'momentum', intensity: 0.3 };
    default:
      return { channel: 'momentum', intensity: 0.4 };
  }
}

/**
 * Create ALS feedback message
 * 
 * Instead of console.log, use this to send system messages through ALS
 * Messages are stored in window.__alsMessages for UI components to display
 */
export function alsLog(level: ALSMessageLevel, message: string, ...args: any[]): void {
  // In development, still log to console for debugging
  if (import.meta.env.DEV) {
    const prefix = `[ALS ${level.toUpperCase()}]`;
    console.log(prefix, message, ...args);
  }
  
  // Create ALS message
  const { channel, intensity } = levelToALS(level);
  const alsMessage: ALSMessage = {
    level,
    message: args.length > 0 ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}` : message,
    channel,
    intensity,
    timestamp: Date.now(),
  };
  
  // Store in global ALS messages array (max 50 messages)
  if (typeof window !== 'undefined') {
    if (!window.__alsMessages) {
      window.__alsMessages = [];
    }
    window.__alsMessages.push(alsMessage);
    if (window.__alsMessages.length > 50) {
      window.__alsMessages.shift();
    }
    
    // Update ALS state with message intensity
    if (!window.__als) {
      window.__als = {
        flow: 0,
        temperature: 'cold',
        guidance: '',
        pulse: 0,
      };
    }
    
    // Create ALS feedback for visual display
    const feedback = alsHelpers.generateALSFeedback(channel, intensity, 0.5);
    
    // Trigger ALS pulse for important messages
    if (level === 'error' || level === 'warning') {
      (window.__als as any).pressure = intensity;
      (window.__als as any).momentum = intensity * 0.7;
    } else if (level === 'success') {
      (window.__als as any).harmony = intensity;
    }
  }
}

/**
 * Convenience functions for different message levels
 */
export const als = {
  info: (message: string, ...args: any[]) => alsLog('info', message, ...args),
  success: (message: string, ...args: any[]) => alsLog('success', message, ...args),
  warning: (message: string, ...args: any[]) => alsLog('warning', message, ...args),
  error: (message: string, ...args: any[]) => alsLog('error', message, ...args),
  system: (message: string, ...args: any[]) => alsLog('system', message, ...args),
};

/**
 * Get recent ALS messages
 */
export function getALSMessages(count: number = 10): ALSMessage[] {
  if (typeof window === 'undefined' || !window.__alsMessages) {
    return [];
  }
  return window.__alsMessages.slice(-count);
}

/**
 * Clear ALS messages
 */
export function clearALSMessages(): void {
  if (typeof window !== 'undefined') {
    window.__alsMessages = [];
  }
}

// Extend Window interface
declare global {
  interface Window {
    __alsMessages?: ALSMessage[];
  }
}
