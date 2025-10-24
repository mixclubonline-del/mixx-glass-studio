/**
 * Mixx Club Studio - Preload Script
 * Secure bridge between main and renderer processes
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Menu events
  onMenuNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
  onMenuOpenProject: (callback) => ipcRenderer.on('menu-open-project', callback),
  onMenuSaveProject: (callback) => ipcRenderer.on('menu-save-project', callback),
  onMenuImportAudio: (callback) => ipcRenderer.on('menu-import-audio', callback),
  onMenuExportMix: (callback) => ipcRenderer.on('menu-export-mix', callback),
  
  // Transport events
  onTransportPlayPause: (callback) => ipcRenderer.on('transport-play-pause', callback),
  onTransportStop: (callback) => ipcRenderer.on('transport-stop', callback),
  onTransportRecord: (callback) => ipcRenderer.on('transport-record', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Platform info
  platform: process.platform,
  isElectron: true
});

// Handle window events
window.addEventListener('DOMContentLoaded', () => {
  // Add desktop-specific styling
  document.body.classList.add('desktop-app');
  
  // Prevent context menu in production
  if (process.env.NODE_ENV !== 'development') {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
});