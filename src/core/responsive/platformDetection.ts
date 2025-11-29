/**
 * Platform Detection System
 * 
 * Detects platform, device type, screen characteristics, and orientation.
 * Provides contextual information for adaptive layouts across all platforms.
 * 
 * Supports:
 * - Desktop (Windows, macOS, Linux)
 * - Mobile (iOS, Android)
 * - Tablet (iPad, Android tablets)
 * - VisionOS (Apple Vision Pro)
 * - Web (browser detection)
 * - Tauri (desktop app wrapper)
 */

export type Platform = 'desktop' | 'mobile' | 'tablet' | 'visionos' | 'unknown';
export type OS = 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'visionos' | 'unknown';
export type DeviceType = 'phone' | 'tablet' | 'desktop' | 'tv' | 'wearable' | 'unknown';
export type Orientation = 'portrait' | 'landscape';

export interface PlatformInfo {
  platform: Platform;
  os: OS;
  deviceType: DeviceType;
  orientation: Orientation;
  isTauri: boolean;
  isTouchDevice: boolean;
  isHighDPI: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  userAgent: string;
}

/**
 * Detect if running in Tauri
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && 
         typeof (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== 'undefined';
}

/**
 * Detect operating system
 */
export function detectOS(): OS {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unknown';
  }

  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  // VisionOS detection (check before macOS)
  if (userAgent.includes('visionos') || platform.includes('vision')) {
    return 'visionos';
  }

  // macOS detection
  if (platform.includes('mac') || userAgent.includes('mac os')) {
    return 'macos';
  }

  // Windows detection
  if (platform.includes('win') || userAgent.includes('windows')) {
    return 'windows';
  }

  // Linux detection
  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }

  // iOS detection
  if (platform.includes('iphone') || platform.includes('ipad') || platform.includes('ipod') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'ios';
  }

  // Android detection
  if (userAgent.includes('android')) {
    return 'android';
  }

  return 'unknown';
}

/**
 * Detect device type
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const userAgent = navigator.userAgent.toLowerCase();

  // VisionOS
  if (detectOS() === 'visionos') {
    return 'desktop'; // Treat as desktop-like for layout purposes
  }

  // Check for TV (large screen, typically 1920x1080 or higher)
  if (width >= 1920 && height >= 1080 && !navigator.userAgent.includes('Mobile')) {
    // Could be TV, but also could be desktop - check for TV-specific indicators
    if (userAgent.includes('smart-tv') || userAgent.includes('smarttv')) {
      return 'tv';
    }
  }

  // Check for wearable (very small screens)
  if (width <= 400 && height <= 400) {
    return 'wearable';
  }

  // Mobile/Tablet detection based on screen size and touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    // Tablet: typically 768px or wider, or iPad
    if (width >= 768 || userAgent.includes('ipad') || (width >= 600 && height >= 600)) {
      return 'tablet';
    }
    // Phone: smaller touch devices
    return 'phone';
  }

  // Desktop: non-touch devices or large screens
  return 'desktop';
}

/**
 * Detect platform category
 */
export function detectPlatform(): Platform {
  const os = detectOS();
  const deviceType = detectDeviceType();

  if (os === 'visionos') {
    return 'visionos';
  }

  if (deviceType === 'tablet') {
    return 'tablet';
  }

  if (deviceType === 'phone') {
    return 'mobile';
  }

  // Desktop includes desktop, tv, and unknown device types on desktop OS
  if (os === 'macos' || os === 'windows' || os === 'linux') {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * Detect screen orientation
 */
export function detectOrientation(): Orientation {
  if (typeof window === 'undefined') {
    return 'landscape';
  }

  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

/**
 * Check if device is touch-enabled
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if device has high DPI display
 */
export function isHighDPI(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.devicePixelRatio > 1.5;
}

/**
 * Get comprehensive platform information
 */
export function getPlatformInfo(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      platform: 'unknown',
      os: 'unknown',
      deviceType: 'unknown',
      orientation: 'landscape',
      isTauri: false,
      isTouchDevice: false,
      isHighDPI: false,
      screenWidth: 0,
      screenHeight: 0,
      devicePixelRatio: 1,
      userAgent: '',
    };
  }

  return {
    platform: detectPlatform(),
    os: detectOS(),
    deviceType: detectDeviceType(),
    orientation: detectOrientation(),
    isTauri: isTauri(),
    isTouchDevice: isTouchDevice(),
    isHighDPI: isHighDPI(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    userAgent: navigator.userAgent,
  };
}

/**
 * Check if platform supports specific features
 */
export function supportsFeature(feature: 'touch' | 'pointer' | 'hover' | 'gestures'): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  switch (feature) {
    case 'touch':
      return isTouchDevice();
    case 'pointer':
      return 'PointerEvent' in window;
    case 'hover':
      return window.matchMedia('(hover: hover)').matches;
    case 'gestures':
      return 'ongesturestart' in window;
    default:
      return false;
  }
}



