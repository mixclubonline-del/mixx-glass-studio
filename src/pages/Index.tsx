import { useState, useEffect, useRef } from 'react';
import { AudioEngine, EffectParams } from '@/audio/AudioEngine';
import { TransportControls } from '@/studio/components/TransportControls';
import { HorizontalTimeline } from '@/studio/components/Timeline/HorizontalTimeline';
import { TrackLoader } from '@/studio/components/TrackLoader';
import { EffectsRack } from '@/studio/components/EffectsRack';
import { MixerPanel } from '@/studio/components/Mixer/MixerPanel';
import { AutomationPanel } from '@/studio/components/Automation';
import { AIAssistantPanel } from '@/studio/components/AI';
import { useToast } from '@/hooks/use-toast';
import { PeakLevel } from '@/types/audio';
import { PluginBrowser, PluginWindow, MixxReverb, MixxTune } from '@/studio/components/Plugins';
import { Sparkles } from 'lucide-react';
import '@/studio/components/Plugins/PluginRegistry'; // Register all plugins
import { PluginManager } from '@/audio/plugins/PluginManager';
import { TopMenuBar, ViewContainer } from '@/studio/components/Navigation';
import { useViewStore } from '@/store/viewStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const Index = () => {
  const { toast } = useToast();
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  const [peakLevels, setPeakLevels] = useState<Map<string, PeakLevel>>(new Map());
  const [masterPeak, setMasterPeak] = useState<PeakLevel>({ left: -60, right: -60 });
  
  // View state from Zustand
  const { currentView, activePluginId, pluginParams, isPanelOpen, setActivePlugin } = useViewStore();
  const [activePluginParamsLocal, setActivePluginParamsLocal] = useState<Record<string, number>>({});
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  // Effect parameters
  const [effects, setEffects] = useState({
    reverbMix: 0.3,
    delayTime: 0.375,
    delayFeedback: 0.4,
    delayMix: 0.2,
    limiterThreshold: -1.0
  });

  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      if (audioEngineRef.current) {
        const time = audioEngineRef.current.getCurrentTime();
        setCurrentTime(time);
        
        if (time >= duration && duration > 0) {
          handleStop();
        }
        
        // Update peak meters
        const newPeaks = new Map<string, PeakLevel>();
        audioEngineRef.current.getTracks().forEach(track => {
          newPeaks.set(track.id, audioEngineRef.current!.getTrackPeakLevel(track.id));
        });
        setPeakLevels(newPeaks);
        setMasterPeak(audioEngineRef.current.getMasterPeakLevel());
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const handleLoadTrack = async (file: File) => {
    if (!audioEngineRef.current) return;
    
    try {
      const id = `track-${Date.now()}-${Math.random()}`;
      await audioEngineRef.current.loadTrack(id, file.name, file);
      
      const newTracks = audioEngineRef.current.getTracks();
      setTracks(newTracks);
      setDuration(audioEngineRef.current.getDuration());
      
      toast({
        title: 'Track loaded',
        description: `${file.name} added to mix`,
      });
    } catch (error) {
      toast({
        title: 'Error loading track',
        description: 'Failed to decode audio file',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveTrack = (id: string) => {
    if (!audioEngineRef.current) return;
    
    audioEngineRef.current.removeTrack(id);
    const newTracks = audioEngineRef.current.getTracks();
    setTracks(newTracks);
    setDuration(audioEngineRef.current.getDuration());
  };

  const handleVolumeChange = (id: string, volume: number) => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.setTrackVolume(id, volume);
    setTracks([...audioEngineRef.current.getTracks()]);
  };

  const handleMuteToggle = (id: string) => {
    if (!audioEngineRef.current) return;
    const track = tracks.find(t => t.id === id);
    if (track) {
      audioEngineRef.current.setTrackMute(id, !track.muted);
      setTracks([...audioEngineRef.current.getTracks()]);
    }
  };

  const handlePlay = () => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (time: number) => {
    if (!audioEngineRef.current) return;
    const wasPlaying = isPlaying;
    
    if (wasPlaying) {
      audioEngineRef.current.pause();
    }
    
    setCurrentTime(time);
    
    if (wasPlaying) {
      audioEngineRef.current.play();
    }
  };

  const handleEffectChange = (param: string, value: number) => {
    if (!audioEngineRef.current) return;
    
    audioEngineRef.current.updateEffect(param as keyof EffectParams, value);
    setEffects(prev => ({ ...prev, [param]: value }));
  };

  const handleExport = async () => {
    if (!audioEngineRef.current) return;
    
    setIsExporting(true);
    
    try {
      const blob = await audioEngineRef.current.exportMix();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mixx-club-export-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Mix exported',
        description: 'Your mix has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to render mix',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlay: handlePlay,
    onPause: handlePause,
    onStop: handleStop,
    onExport: handleExport,
    onAIAssistant: () => setShowAIAssistant(prev => !prev),
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 gradient-animate opacity-10 pointer-events-none" />
      
      {/* Grid overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--prime-500)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--prime-500)) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Top Menu Bar */}
      <div className="relative z-20">
        <TopMenuBar 
          onExport={handleExport}
          onSave={() => toast({ title: 'Save feature coming soon!' })}
          onLoad={() => toast({ title: 'Load feature coming soon!' })}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-4 py-6 space-y-6 overflow-auto">
        {/* Header */}
        <header className="text-center space-y-2 mb-8">
          <h1 className="text-5xl font-bold neon-text tracking-tight">
            Mixx Club Pro Studio
          </h1>
          <p className="text-muted-foreground">
            The artist in the engineer — putting their hands on The Mixx
          </p>
          <div className="text-xs text-muted-foreground/60">
            Created by <span className="text-[hsl(var(--prime-500))]">Ravenis Prime</span>
          </div>
        </header>

        {/* Main workspace with horizontal timeline and mixer */}
        <ViewContainer className="flex flex-col">
          <HorizontalTimeline />
          
          <AutomationPanel />
          
          <MixerPanel />
          
          <TransportControls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onExport={handleExport}
            isExporting={isExporting}
            bpm={bpm}
            timeSignature={timeSignature}
            onBpmChange={setBpm}
            onTimeSignatureChange={setTimeSignature}
          />
        </ViewContainer>

        {/* Footer branding */}
        <footer className="text-center text-sm text-muted-foreground/50 pt-8">
          <p>Mixx Club: where the sound meets the soul</p>
          <p className="text-xs mt-1">Prime built it for the future — 2030-ready</p>
        </footer>
      </div>
      
      {/* Plugin Browser */}
      <PluginBrowser
        isOpen={isPanelOpen.browser}
        onClose={() => useViewStore.getState().togglePanel('browser')}
        onPluginSelect={(pluginId) => {
          const pluginDef = PluginManager.getPlugins().find(p => p.metadata.id === pluginId);
          setActivePlugin(pluginId, pluginDef?.defaultParameters || {});
          setActivePluginParamsLocal(pluginDef?.defaultParameters || {});
        }}
      />
      
      {/* Active Plugin Windows */}
      {activePluginId === 'mixxreverb' && (
        <PluginWindow
          title="MixxReverb - Atmos Designer"
          onClose={() => setActivePlugin(null)}
          defaultWidth={700}
          defaultHeight={450}
        >
          <MixxReverb />
        </PluginWindow>
      )}
      
      {activePluginId === 'mixxtune' && (
        <MixxTune
          onClose={() => setActivePlugin(null)}
          parameters={activePluginParamsLocal}
          onChange={(newParams) => setActivePluginParamsLocal(newParams)}
        />
      )}
      
      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
      />
      
      {/* AI Assistant Toggle FAB */}
      <button
        onClick={() => setShowAIAssistant(!showAIAssistant)}
        className="fixed right-4 bottom-24 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-40"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Index;