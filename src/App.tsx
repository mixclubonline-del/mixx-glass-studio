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
  
  // Detect if running in Tauri or Electron
  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;
  const isDesktopApp = isElectron || (typeof window !== 'undefined' && !!window.electronAPI) || isTauri;
  const [currentView, setCurrentView] = useState<AppView>('index');

  // Force studio mode in desktop apps
  useEffect(() => {
    if (isDesktopApp) {
      setCurrentView('studio');
    }
  }, [isDesktopApp]);

  useEffect(() => {
    console.log('🎛️ APP INIT:', {
      isElectron,
      isTauri,
      hasElectronAPI: typeof window !== 'undefined' && !!window.electronAPI,
      isDesktopApp,
      currentView,
      platform: typeof window !== 'undefined' && window.electronAPI?.platform
    });
  }, [isElectron, isDesktopApp, currentView, isTauri]);

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