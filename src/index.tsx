import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './core/responsive/responsive.css';
import { initResponsiveScale } from './core/responsive';
import { initPerformanceMonitoring } from './utils/performanceMetrics';

// Initialize responsive scale system
initResponsiveScale();

// Phase 1: Initialize performance monitoring for CSS optimization validation
// Access via: window.__performanceMonitor in console
if (typeof window !== 'undefined') {
  const monitor = initPerformanceMonitoring();
  (window as any).__performanceMonitor = monitor;
  
  // Expose helper functions for easy testing
  (window as any).__measureBaseline = async () => {
    await monitor.setBaseline();
    console.log('✅ Baseline metrics captured');
  };
  
  (window as any).__measureCurrent = async () => {
    await monitor.takeCurrent();
    console.log('✅ Current metrics captured');
  };
  
  (window as any).__getMetrics = () => {
    const metrics = monitor.getMetrics();
    console.table(metrics);
    return metrics;
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);