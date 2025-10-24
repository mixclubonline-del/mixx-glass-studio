import { useEffect, useState } from "react";
import { useElectron } from "./hooks/useElectron";
import Index from "./pages/Index";
import StudioPage from "./pages/StudioPage";
import FlowCanvasDemo from "./pages/FlowCanvasDemo";
import BloomDemo from "./pages/BloomDemo";

// Desktop navigation state
type AppView = 'index' | 'studio' | 'flow-canvas' | 'bloom-demo';

const App = () => {
  const { isElectron, setupMenuHandlers, cleanup } = useElectron();
  
  // Aggressive detection: Tauri, Electron, or any non-web environment
  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;
  const hasElectronAPI = typeof window !== 'undefined' && !!window.electronAPI;
  const isWebBrowser = typeof window !== 'undefined' && window.location && !isTauri && !isElectron && !hasElectronAPI;
  
  // DEFAULT TO STUDIO MODE (only show index in actual web browsers)
  const [currentView, setCurrentView] = useState<AppView>(isWebBrowser ? 'index' : 'studio');

  useEffect(() => {
    // FORCE studio mode if running in any desktop environment
    if (!isWebBrowser) {
      setCurrentView('studio');
      console.log('🎛️ DESKTOP APP DETECTED - Loading StudioPage');
    }
  }, [isWebBrowser]);

  useEffect(() => {
    console.log('🎛️ APP INIT:', {
      isElectron,
      isTauri,
      hasElectronAPI,
      isWebBrowser,
      currentView,
      userAgent: navigator.userAgent.substring(0, 50),
      platform: typeof window !== 'undefined' && window.electronAPI?.platform
    });
  }, [isElectron, isTauri, hasElectronAPI, isWebBrowser, currentView]);

  // Set up desktop menu handlers
  useEffect(() => {
    if (isElectron) {
      setupMenuHandlers({
        onNewProject: () => {
          console.log('New project from menu');
          // Handle new project creation
        },
        onOpenProject: (filePath) => {
          console.log('Open project:', filePath);
          // Handle project loading
        },
        onSaveProject: () => {
          console.log('Save project from menu');
          // Handle project saving
        },
        onImportAudio: (filePaths) => {
          console.log('Import audio:', filePaths);
          // Handle audio import
        },
        onExportMix: () => {
          console.log('Export mix from menu');
          // Handle mix export
        },
        onPlayPause: () => {
          console.log('Play/Pause from menu');
          // Handle transport control
        },
        onStop: () => {
          console.log('Stop from menu');
          // Handle transport control
        },
        onRecord: () => {
          console.log('Record from menu');
          // Handle transport control
        }
      });
    }

    return cleanup;
  }, [isElectron, setupMenuHandlers, cleanup]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Desktop-native navigation - no web routing */}
      {currentView === 'index' && <Index onNavigate={(view) => setCurrentView(view as AppView)} />}
      {currentView === 'studio' && <StudioPage />}
      {currentView === 'flow-canvas' && <FlowCanvasDemo />}
      {currentView === 'bloom-demo' && <BloomDemo />}
    </div>
  );
};

export default App;