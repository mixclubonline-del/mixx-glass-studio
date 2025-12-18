import React, { useState, useEffect, useCallback } from 'react';
import {
  findPlugin,
  INITIAL_PLUGIN_SIZES,
  INITIAL_PLUGIN_POSITIONS,
  INITIAL_PLUGIN_STATES,
  PluginKey,
  TierName,
} from './constants';
import {
  MixxClubLogo,
  HaloIcon,
  SaveIcon,
  SettingsIcon,
  LinkIcon,
  GridIcon,
  ResetIcon,
  XIcon,
} from './components/shared/Icons';
import { HaloSchematic } from './components/HaloSchematic';
import {
  SessionContext,
  PluginPositions,
  PluginSize,
  PluginSizes,
  PluginPosition,
  SpecificPluginSettingsMap,
  PluginStates,
  MidiMappingMap,
  PluginComponentProps,
  Preset,
  PanelType,
  SidechainLink,
  AudioSignal,
  SuitePluginSurfaceProps,
} from './types';
import { ResizableContainer } from './components/shared/ResizableContainer';
import { useFlowMotion, useAnimatePresence, AnimatePresence } from '../../components/mixxglass';
import { useMidi } from './hooks/useMidi';
import { isControlChange } from './lib/midi';
import { usePresets } from './hooks/usePresets';
import { RoutingView } from './components/RoutingView';
import { PluginBrowser } from './components/PluginBrowser';
import { SidePanel } from './components/SidePanel';
import { PrimeBrainStub } from './lib/PrimeBrainStub';
import { NeuralGridBackground } from './components/shared/NeuralGridBackground';
import { useSimulatedAudio } from './hooks/useSimulatedAudio';
import './SuitePluginSurface.css';

// Header with transition
const HeaderWithTransition: React.FC<{
  isTransitioning: boolean;
  children: React.ReactNode;
}> = ({ isTransitioning, children }) => {
  const headerStyle = useFlowMotion(
    { opacity: isTransitioning ? 0 : 1 },
    { duration: 200 }
  );
  return (
    <header 
      className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 suite-header-transition"
      style={{ '--header-opacity': headerStyle.opacity } as React.CSSProperties}
    >
      {children}
    </header>
  );
};

// Halo View Component
const HaloView: React.FC<{
  setActivePlugin: (p: PluginKey) => void;
  sessionContext: any;
  pluginStates: any;
}> = ({ setActivePlugin, sessionContext, pluginStates }) => {
  const haloAnimation = useAnimatePresence({
    isVisible: true,
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 300 },
  });

  return (
    <div 
      className="suite-halo-view" 
      style={{ 
        '--halo-opacity': haloAnimation.style.opacity,
        '--halo-transform': haloAnimation.style.transform 
      } as React.CSSProperties}
    >
      <HaloSchematic 
        setActivePlugin={setActivePlugin}
        sessionContext={sessionContext}
        pluginStates={pluginStates} 
      />
    </div>
  );
};

// Routing Panel Component
const RoutingPanel: React.FC<{
  sidechainLinks: any;
  onAddLink: any;
  onRemoveLink: any;
  onClose: () => void;
}> = ({ sidechainLinks, onAddLink, onRemoveLink, onClose }) => {
  const routingAnimation = useAnimatePresence({
    isVisible: true,
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 300 },
  });

  return (
    <div 
      className="suite-routing-panel" 
      style={{ 
        '--routing-opacity': routingAnimation.style.opacity,
        '--routing-transform': routingAnimation.style.transform 
      } as React.CSSProperties}
    >
      <RoutingView 
        sidechainLinks={sidechainLinks}
        onAddLink={onAddLink}
        onRemoveLink={onRemoveLink}
        onClose={onClose}
      />
    </div>
  );
};

const tierColorMap: Record<TierName, string> = {
  'Core Tier': 'var(--glow-cyan)',
  'Neural Tier': 'var(--glow-pink)',
  'Master Tier': '#f59e0b',
  'Signature / Experimental Tier': '#f43f5e',
  'System Tier': '#8b5cf6',
};

const SuitePluginSurface: React.FC<SuitePluginSurfaceProps> = ({
  trackId,
  trackName,
  existingPluginIds,
  initialPluginId,
  onAddPlugin,
  onClose,
}) => {
  const [activePlugin, setActivePlugin] = useState<PluginKey | null>(initialPluginId as PluginKey ?? null);
  const [view, setView] = useState<'plugin' | 'halo'>('plugin');
  const [sessionContext, setSessionContext] = useState<SessionContext>({ mood: 'Neutral' });
  const [pluginStates, setPluginStates] = useState<PluginStates>(INITIAL_PLUGIN_STATES);
  const [pluginSizes, setPluginSizes] = useState<PluginSizes>(INITIAL_PLUGIN_SIZES);
  const [pluginPositions, setPluginPositions] = useState<PluginPositions>(INITIAL_PLUGIN_POSITIONS);
  const [activePluginZIndex, setActivePluginZIndex] = useState(10);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gridGlow, setGridGlow] = useState({ color: tierColorMap['Core Tier'], opacity: 0.3 });

  const audioSignal: AudioSignal = useSimulatedAudio();

  // MIDI State
  const { inputs: midiInputs, selectedInputId, setSelectedInputId, attachMidiListener } = useMidi();
  const [midiMappings, setMidiMappings] = useState<MidiMappingMap>({});
  const [midiLearnTarget, setMidiLearnTarget] = useState<{ pluginKey: PluginKey, paramName: string, min: number, max: number } | null>(null);

  // Preset State
  const { presets, savePreset, deletePreset } = usePresets();

  // Routing State
  const [sidechainLinks, setSidechainLinks] = useState<SidechainLink[]>([]);

  const handleSelectPlugin = (pluginKey: PluginKey) => {
    setIsTransitioning(true);
    setActivePlugin(pluginKey);
    const pluginMeta = findPlugin(pluginKey);
    PrimeBrainStub.sendEvent('plugin_activated', { pluginKey, name: pluginMeta.name, pluginId: pluginMeta.id });
  };

  const handleClosePlugin = () => {
    setIsTransitioning(true);
    setActivePlugin(null);
  };

  const handlePreviewPlugin = useCallback(
    (pluginId: string) => {
      PrimeBrainStub.sendEvent('plugin_preview', { pluginId, trackId });
    },
    [trackId]
  );

  const handleRoutePlugin = useCallback(
    (pluginId: string) => {
      PrimeBrainStub.sendEvent('plugin_routed', { pluginId, trackId });
      onAddPlugin?.(pluginId);
    },
    [onAddPlugin, trackId]
  );

  const handleRouteActivePlugin = useCallback(() => {
    if (!activePlugin) return;
    const pluginInfo = findPlugin(activePlugin);
    handleRoutePlugin(pluginInfo.id);
  }, [activePlugin, handleRoutePlugin]);

  useEffect(() => {
    if (view === 'halo') {
      setGridGlow({ color: '#a855f7', opacity: 0.5 });
    } else if (activePlugin) {
      const pluginInfo = findPlugin(activePlugin);
      setGridGlow({ color: tierColorMap[pluginInfo.tier as TierName], opacity: 0.4 });
    } else {
      setGridGlow({ color: tierColorMap['Core Tier'], opacity: 0.3 });
    }
  }, [activePlugin, view]);

  const handlePluginStateChange = useCallback(<K extends PluginKey>(
    pluginId: K, 
    newState: Partial<SpecificPluginSettingsMap[K]> | ((prevState: SpecificPluginSettingsMap[K]) => Partial<SpecificPluginSettingsMap[K]>)
  ) => {
    setPluginStates(prevStates => {
      const currentPluginState = prevStates[pluginId];
      let updatedPartialState: Partial<SpecificPluginSettingsMap[K]>;

      if (typeof newState === 'function') {
        updatedPartialState = (newState as (prevState: SpecificPluginSettingsMap[K]) => Partial<SpecificPluginSettingsMap[K]>)(currentPluginState);
      } else {
        updatedPartialState = newState;
      }

      return {
        ...prevStates,
        [pluginId]: {
          ...currentPluginState,
          ...updatedPartialState
        } as SpecificPluginSettingsMap[K]
      };
    });
  }, []);

  const handleMidiMessage = useCallback((message: MIDIMessageEvent) => {
    if (!message.data || !isControlChange(message) || !message.target) return;

    const [, cc, value] = message.data;
    const deviceId = (message.target as any).id;
    const mappingKey = `${deviceId}-${cc}`;

    if (midiLearnTarget) {
        const newMapping = {
            pluginKey: midiLearnTarget.pluginKey,
            paramName: midiLearnTarget.paramName,
            min: midiLearnTarget.min,
            max: midiLearnTarget.max,
        };
        setMidiMappings(prev => ({ ...prev, [mappingKey]: newMapping }));
        PrimeBrainStub.sendEvent('midi_mapped', { deviceId, cc, ...newMapping });
        setMidiLearnTarget(null);
        return;
    }

    const mapping = midiMappings[mappingKey];
    if (mapping) {
        const { pluginKey, paramName, min, max } = mapping;
        const scaledValue = min + (value / 127) * (max - min);
        handlePluginStateChange(pluginKey as PluginKey, (prevState: any) => ({
            ...prevState,
            [paramName]: scaledValue,
        }));
    }
  }, [midiLearnTarget, midiMappings, handlePluginStateChange]);

  useEffect(() => {
    const cleanup = attachMidiListener(handleMidiMessage);
    return cleanup;
  }, [attachMidiListener, handleMidiMessage]);

  const handleMidiLearnStart = useCallback((pluginKey: PluginKey, paramName: string, min: number, max: number) => {
    setMidiLearnTarget(prev => {
        if (prev && prev.pluginKey === pluginKey && prev.paramName === paramName) {
            return null;
        }
        PrimeBrainStub.sendEvent('midi_learn_started', { pluginKey, paramName });
        return { pluginKey, paramName, min, max };
    });
  }, []);

  const handleSavePreset = () => {
    const name = window.prompt("Enter a name for your preset:");
    if (name) {
      const isOverwriting = presets.some(p => p.name === name);
      if (isOverwriting) {
        if (!window.confirm(`A preset named "${name}" already exists. Overwrite it?`)) {
          return;
        }
      }
      savePreset(name, pluginStates);
      PrimeBrainStub.sendEvent('preset_saved', { name });
    }
  };

  const handleLoadPreset = (name: string) => {
    const preset = presets.find(p => p.name === name);
    if (preset) {
      setPluginStates(preset.states);
      PrimeBrainStub.sendEvent('preset_loaded', { name });
    }
  };

  const handleDeletePreset = (name: string) => {
    if (window.confirm(`Are you sure you want to delete the preset "${name}"?`)) {
      deletePreset(name);
      PrimeBrainStub.sendEvent('preset_deleted', { name });
    }
  };
  
  const handleAddLink = useCallback((newLink: SidechainLink) => {
    setSidechainLinks(prev => {
      if (prev.some(link => link.to === newLink.to)) return prev;
      PrimeBrainStub.sendEvent('sidechain_linked', newLink);
      return [...prev, newLink];
    });
  }, []);

  const handleRemoveLink = useCallback((linkToRemove: SidechainLink) => {
    setSidechainLinks(prev => prev.filter(link => !(link.from === linkToRemove.from && link.to === linkToRemove.to)));
    PrimeBrainStub.sendEvent('sidechain_unlinked', linkToRemove);
    const targetPluginKey = linkToRemove.to;
    const pluginInfo = findPlugin(targetPluginKey);
    if (pluginInfo.canBeSidechainTarget) {
      handlePluginStateChange(targetPluginKey, { sidechainActive: false } as any);
    }
  }, [handlePluginStateChange]);

  const handleResetSession = () => {
    if (window.confirm('Are you sure you want to reset your session? All settings will be lost.')) {
      localStorage.clear();
      PrimeBrainStub.sendEvent('session_reset', {});
      window.location.reload();
    }
  };

  const renderActivePlugin = () => {
    if (!activePlugin) return null;

    const pluginInfo = findPlugin(activePlugin);
    const ActivePluginComponent = pluginInfo.component as React.FC<PluginComponentProps<any>>;
    type CurrentPluginSettings = React.ComponentProps<typeof ActivePluginComponent>['pluginState'];
    
    const pluginProps = {
      name: pluginInfo.name,
      description: pluginInfo.description,
      sessionContext,
      setSessionContext: (newContext: SessionContext) => setSessionContext(newContext),
      pluginState: pluginStates[activePlugin] as CurrentPluginSettings, 
      setPluginState: (newState: Partial<CurrentPluginSettings> | ((prevState: CurrentPluginSettings) => Partial<CurrentPluginSettings>)) => handlePluginStateChange(activePlugin, newState as any),
      isLearning: (paramName: string) => midiLearnTarget?.pluginKey === activePlugin && midiLearnTarget?.paramName === paramName,
      onMidiLearn: (paramName: string, min: number, max: number) => handleMidiLearnStart(activePlugin, paramName, min, max),
      isSidechainTarget: sidechainLinks.some(link => link.to === activePlugin),
      audioSignal: audioSignal, // Pass the global audio signal here
      onClose: handleClosePlugin, // Pass the close handler to the plugin
    };

    return (
      <ResizableContainer
        key={activePlugin}
        layoutId={activePlugin}
        initialSize={pluginSizes[activePlugin]}
        initialPosition={pluginPositions[activePlugin]}
        onResizeStop={(newSize) => setPluginSizes(prev => ({ ...prev, [activePlugin]: newSize }))}
        onDragStop={(newPosition) => setPluginPositions(prev => ({ ...prev, [activePlugin]: newPosition }))}
        onInteractionStart={() => setActivePluginZIndex(50)}
        onInteractionStop={() => setActivePluginZIndex(40)}
        zIndex={activePluginZIndex}
        onAnimationComplete={() => setIsTransitioning(false)}
      >
        <div className="relative h-full w-full">
          <ActivePluginComponent {...pluginProps} />
          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-end">
            <button
              onClick={handleRouteActivePlugin}
              className="pointer-events-auto rounded-full border border-white/25 bg-white/15 px-5 py-2 text-[0.6rem] uppercase tracking-[0.32em] text-white/85 transition-all hover:bg-white/25"
            >
              Route {findPlugin(activePlugin).name} to Track
            </button>
          </div>
        </div>
      </ResizableContainer>
    );
  };

  return (
    <div className="text-white min-h-screen bg-[#020010]">
      <NeuralGridBackground glowColor={gridGlow.color} glowOpacity={gridGlow.opacity} />
      <div className="relative flex flex-col h-screen p-4 gap-4">
        <HeaderWithTransition isTransitioning={isTransitioning}>
          <div className="flex items-center gap-4">
            <MixxClubLogo className="h-8 w-8 transition-all duration-200 hover:scale-105" />
            <div className="flex flex-col">
              <h1 className="font-orbitron text-xl font-bold tracking-wider text-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                MixxClub
              </h1>
              {trackName && (
                <span className="text-[0.6rem] uppercase tracking-[0.4em] text-white/55">
                  Routing into {trackName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 p-2 backdrop-blur-md">
            {activePlugin && view === 'plugin' && (
              <button
                onClick={handleClosePlugin}
                className="group p-2 text-white/60 transition-colors hover:text-white"
                title="Plugin Browser"
              >
                <GridIcon className="h-5 w-5 text-cyan-300 transition-all group-hover:drop-shadow-[0_0_3px_var(--glow-cyan)]" />
              </button>
            )}
            <button
              onClick={() => setActivePanel('presets')}
              className="group p-2 text-white/60 transition-colors hover:text-white"
              title="Presets"
            >
              <SaveIcon className="h-5 w-5 transition-all group-hover:drop-shadow-[0_0_2px_white]" />
            </button>
            <button
              onClick={() => setActivePanel('midi')}
              className="group p-2 text-white/60 transition-colors hover:text-white"
              title="MIDI Settings"
            >
              <SettingsIcon className="h-5 w-5 transition-all group-hover:drop-shadow-[0_0_2px_white]" />
            </button>
            <button
              onClick={() => setActivePanel('routing')}
              className="group p-2 text-white/60 transition-colors hover:text-white"
              title="Routing"
            >
              <LinkIcon className="h-5 w-5 transition-all group-hover:drop-shadow-[0_0_2px_white]" />
            </button>
            <button
              onClick={handleResetSession}
              className="group p-2 text-white/60 transition-colors hover:text-white"
              title="Reset Session"
            >
              <ResetIcon className="h-5 w-5 transition-all group-hover:drop-shadow-[0_0_2px_white]" />
            </button>
            <button
              onClick={() => setView(view === 'plugin' ? 'halo' : 'plugin')}
              className="group rounded-full bg-white/10 p-2 text-cyan-300 transition-all duration-300 hover:bg-cyan-400/20 hover:text-white"
              aria-label="Toggle Halo View"
            >
              <HaloIcon className="h-5 w-5 halo-icon-animated transition-all group-hover:drop-shadow-[0_0_4px_var(--glow-cyan)]" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="group rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Close suite"
              >
                <XIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </HeaderWithTransition>

        <main className="flex-1 flex items-center justify-center transition-all duration-500 pt-16">
          <AnimatePresence mode="wait">
            {view === 'halo' ? (
              <HaloView
                key="halo"
                setActivePlugin={(p: PluginKey) => { 
                  handleSelectPlugin(p); 
                  setView('plugin');
                }}
                sessionContext={sessionContext}
                pluginStates={pluginStates}
              />
            ) : (
               activePlugin ? (
                  <div key="plugin-active" className="w-full h-full">{renderActivePlugin()}</div>
               ) : (
                  <PluginBrowser
                    key="plugin-browser"
                    onSelectPlugin={handleSelectPlugin}
                    activePlugin={activePlugin}
                    isTransitioning={isTransitioning}
                    existingPluginIds={existingPluginIds}
                    onAddToTrack={handleRoutePlugin}
                    onPreviewPlugin={handlePreviewPlugin}
                  />
               )
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {activePanel === 'routing' && (
            <RoutingPanel
              sidechainLinks={sidechainLinks}
              onAddLink={handleAddLink}
              onRemoveLink={handleRemoveLink}
              onClose={() => setActivePanel(null)}
            />
          )}
        </AnimatePresence>
        
        <SidePanel
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          presets={presets}
          onSavePreset={handleSavePreset}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
          midiInputs={midiInputs}
          selectedMidiInput={selectedInputId}
          onMidiInputChange={(id) => {
            setSelectedInputId(id || null);
            setMidiLearnTarget(null);
          }}
        />
      </div>
    </div>
  );
};

export default SuitePluginSurface;