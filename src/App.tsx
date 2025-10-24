import { useEffect } from "react";
import { useElectron } from "./hooks/useElectron";
import StudioPage from "./pages/StudioPage";

const App = () => {
  const { isElectron, setupMenuHandlers, cleanup } = useElectron();

  // Set up desktop menu handlers
  useEffect(() => {
    if (isElectron) {
      setupMenuHandlers({
        onNewProject: () => {
          console.log('New project from menu');
        },
        onOpenProject: (filePath) => {
          console.log('Open project:', filePath);
        },
        onSaveProject: () => {
          console.log('Save project from menu');
        },
        onImportAudio: (filePaths) => {
          console.log('Import audio:', filePaths);
        },
        onExportMix: () => {
          console.log('Export mix from menu');
        },
        onPlayPause: () => {
          console.log('Play/Pause from menu');
        },
        onStop: () => {
          console.log('Stop from menu');
        },
        onRecord: () => {
          console.log('Record from menu');
        }
      });
    }

    return cleanup;
  }, [isElectron, setupMenuHandlers, cleanup]);

  return (
    <div className="min-h-screen bg-gray-900">
      <StudioPage />
    </div>
  );
};

export default App;
