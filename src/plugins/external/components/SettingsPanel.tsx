
import React from 'react';
import { useAnimatePresence, AnimatePresence } from '../../../components/mixxglass';
import { SettingsPanelProps } from '../types';
import { XIcon } from './shared/Icons';
import { MixxGlassSlider } from '../../../components/mixxglass';
import { PrimeBrainStub } from '../lib/PrimeBrainStub'; // For sending settings change events
import { mapRange } from '../lib/utils'; // Import mapRange
import { ToggleButton } from './shared/ToggleButton'; // Import the ToggleButton

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isActive, onClose, globalSettings, setGlobalSettings }) => {
    // Calculate dynamic transition duration based on globalSettings.animationIntensity
    const dynamicDuration = mapRange(globalSettings.animationIntensity, 0, 100, 300, 200);

    const handleThemeChange = (theme: 'dark' | 'light' | 'dynamic') => {
        setGlobalSettings({ uiTheme: theme });
    };

    const handleAnimationIntensityChange = (value: number) => {
        setGlobalSettings({ animationIntensity: value });
    };

    const handleVisualizerComplexityChange = (complexity: 'high' | 'low') => {
        setGlobalSettings({ visualizerComplexity: complexity });
    };

    const panelBorderColor = 'border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.4)]';

    const panelAnimation = useAnimatePresence({
        isVisible: isActive,
        initial: { x: -256, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -256, opacity: 0 },
        transition: {
            duration: dynamicDuration,
            easing: 'ease-out',
        },
    });

    return (
        <AnimatePresence>
            {isActive && (
                <div
                    key="settings-panel"
                    className="fixed top-0 left-0 h-full w-64 z-[60] pt-4 pb-4 pl-4"
                    style={{
                        transform: panelAnimation.style.transform || 'translateX(0%)',
                        opacity: panelAnimation.style.opacity,
                    }}
                >
                    <div className={`relative h-full bg-gradient-to-br from-black/50 to-transparent backdrop-blur-2xl border-r ${panelBorderColor} rounded-2xl transition-all duration-300`}>
                        <button 
                            onClick={onClose} 
                            className="absolute top-4 right-4 p-1 text-white/50 hover:text-pink-300 z-10 transition-colors hover:scale-110 group-hover:drop-shadow-[0_0_3px_var(--glow-pink)]"
                            title="Close Panel"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                        <div className="p-4 flex flex-col h-full">
                            <h3 className="font-orbitron text-lg font-bold tracking-wider text-cyan-300">GLOBAL SETTINGS</h3>
                            
                            <div className="mt-6 flex flex-col gap-4">
                                <div>
                                    <label className="text-xs text-white/70 block mb-1 font-bold tracking-wider">UI THEME</label>
                                    <div className="flex gap-2">
                                        <ToggleButton 
                                            label="Dark" 
                                            value={globalSettings.uiTheme === 'dark'} 
                                            onChange={() => handleThemeChange('dark')} 
                                        />
                                        <ToggleButton 
                                            label="Dynamic" 
                                            value={globalSettings.uiTheme === 'dynamic'} 
                                            onChange={() => handleThemeChange('dynamic')} 
                                            color="blue"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-white/70 block mb-1 font-bold tracking-wider">ANIMATION INTENSITY</label>
                                    <MixxGlassSlider
                                        value={globalSettings.animationIntensity / 100} // Normalize to 0-1
                                        onChange={(normalized) => handleAnimationIntensityChange(normalized * 100)}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        alsChannel="momentum"
                                        enableFineTuning={true}
                                        enableKeyboard={true}
                                        enableWheel={true}
                                        enableDoubleClickReset={true}
                                        defaultValue={50 / 100}
                                        size="sm"
                                    />
                                    <span className="text-xs text-white/50">{globalSettings.animationIntensity}%</span>
                                </div>

                                <div>
                                    <label className="text-xs text-white/70 block mb-1 font-bold tracking-wider">VISUALIZER COMPLEXITY</label>
                                    <div className="flex gap-2">
                                        <ToggleButton 
                                            label="High" 
                                            value={globalSettings.visualizerComplexity === 'high'} 
                                            onChange={() => handleVisualizerComplexityChange('high')} 
                                        />
                                        <ToggleButton 
                                            label="Low" 
                                            value={globalSettings.visualizerComplexity === 'low'} 
                                            onChange={() => handleVisualizerComplexityChange('low')} 
                                            color="gray"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};
