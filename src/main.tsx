import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PHASE 1: Load plugin registry - enables all 16 plugins
import '@/studio/components/Plugins/PluginRegistry';

createRoot(document.getElementById("root")!).render(<App />);
