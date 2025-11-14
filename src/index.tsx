import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './core/responsive/responsive.css';
import { initResponsiveScale } from './core/responsive';

// Initialize responsive scale system
initResponsiveScale();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);