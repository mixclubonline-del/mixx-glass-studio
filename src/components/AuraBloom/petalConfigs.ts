/**
 * AURA Bloom Petal Configurations
 * 
 * Defines menu items for Welcome and Floating bloom modes.
 * Each petal configuration maps to an action in the Flow DAW.
 */

import React from 'react';

export interface AuraPetalConfig {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  action?: string;
  payload?: unknown;
  subMenu?: string;
  disabled?: boolean;
  accentColor?: string;
}

export interface AuraMenuConfig {
  items: AuraPetalConfig[];
  parent?: string;
}

// Import icons - these will be passed in or imported where used
// Using string identifiers for now, resolved in component

/**
 * Welcome Mode Petals
 * Shown before entering a project - focus on project management
 */
export const welcomePetals: AuraPetalConfig[] = [
  { id: 'newProject', label: 'New', action: 'project:new', accentColor: '#34d399' },
  { id: 'openProject', label: 'Open', action: 'project:open', accentColor: '#60a5fa' },
  { id: 'templates', label: 'Templates', action: 'templates:open', accentColor: '#a78bfa' },
  { id: 'recent', label: 'Recent', action: 'recent:open', accentColor: '#f472b6' },
  { id: 'cloud', label: 'Cloud', action: 'cloud:sync', accentColor: '#22d3ee' },
  { id: 'settings', label: 'Settings', action: 'settings:open', accentColor: '#94a3b8' },
  { id: 'help', label: 'Help', action: 'help:open', accentColor: '#fbbf24' },
  { id: 'about', label: 'About', action: 'about:show', accentColor: '#818cf8' },
];

/**
 * Floating Mode Petals
 * Shown during active session - focus on workflow actions
 */
export const floatingPetals: AuraPetalConfig[] = [
  { id: 'save', label: 'Save', action: 'project:save', accentColor: '#34d399' },
  { id: 'mixer', label: 'Mixer', action: 'view:mixer', accentColor: '#60a5fa' },
  { id: 'plugins', label: 'Plugins', subMenu: 'plugins', accentColor: '#a78bfa' },
  { id: 'import', label: 'Import', action: 'importAudio', accentColor: '#f472b6' },
  { id: 'export', label: 'Export', action: 'export:show', accentColor: '#22d3ee' },
  { id: 'settings', label: 'Settings', action: 'settings:open', accentColor: '#94a3b8' },
  { id: 'ai', label: 'AI', action: 'ai:hub:open', accentColor: '#fbbf24' },
  { id: 'master', label: 'Master', action: 'view:master', accentColor: '#818cf8' },
];

/**
 * Plugins Submenu
 */
export const pluginsPetals: AuraPetalConfig[] = [
  { id: 'browser', label: 'Browse', action: 'plugins:browser:open', accentColor: '#a78bfa' },
  { id: 'favorites', label: 'Favorites', action: 'plugins:favorites:open', accentColor: '#fbbf24' },
  { id: 'recent', label: 'Recent', action: 'plugins:recent:open', accentColor: '#60a5fa' },
  { id: 'back', label: 'Back', subMenu: 'main', accentColor: '#94a3b8' },
];

/**
 * Menu configurations by ID
 */
export const menuConfigs: Record<string, AuraMenuConfig> = {
  welcome: { items: welcomePetals },
  main: { items: floatingPetals },
  plugins: { items: pluginsPetals, parent: 'main' },
};
