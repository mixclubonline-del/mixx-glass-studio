import React, { useState } from 'react';
import { BloomMenu } from './components/BloomMenu';

const App: React.FC = () => {
  // State to manage the application view ('home' = Start Screen, 'tool' = DAW Menu)
  const [appMode, setAppMode] = useState<'home' | 'tool'>('home');

  const handleMenuSelect = (id: string) => {
    // Simulate application flow: 
    // If we are in Home mode and user clicks "New", "Open" or "Suite", launch the Tool mode
    if (appMode === 'home') {
      if (['new', 'open', 'suite'].includes(id)) {
        console.log(`Launching session... [${id}]`);
        // Add a small delay for the click animation to finish before switching context
        setTimeout(() => {
          setAppMode('tool');
        }, 400);
      }
    } else {
      console.log(`Tool action triggered: ${id}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0a12] via-[#12101a] to-[#0d0b14]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[100px] animate-pulse-slow" />
      </div>
      
      <main className="relative z-10">
        {/* 
          Using 'key' forces React to remount the component when mode changes.
          This ensures the menu starts in a 'closed' state when you switch contexts.
        */}
        <BloomMenu 
          key={appMode} 
          variant={appMode} 
          onItemSelect={handleMenuSelect}
        />
      </main>
      
      {/* Dev Controls to easily switch back and forth for demo purposes */}
      <div className="absolute top-6 right-6 z-50 flex gap-2">
        <button 
          onClick={() => setAppMode(appMode === 'home' ? 'tool' : 'home')}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-wider backdrop-blur-md"
        >
          Switch to {appMode === 'home' ? 'Tool' : 'Home'} View
        </button>
      </div>

      <footer className="absolute bottom-6 text-white/20 text-xs tracking-widest uppercase pointer-events-none">
        Aura Interface System v1.0 • {appMode === 'home' ? 'System Ready' : 'Session Active'}
      </footer>
    </div>
  );
};

export default App;