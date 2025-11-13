
import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { SidePanelProps, Preset } from '../types';
import { XIcon } from './shared/Icons';

const panelVariants: Variants = {
    hidden: { x: '-100%', opacity: 0 },
    visible: { x: '0%', opacity: 1, transition: { type: 'spring', stiffness: 350, damping: 35 } },
    exit: { x: '-100%', opacity: 0, transition: { type: 'spring', stiffness: 400, damping: 40 } },
};

const PresetsPanel: React.FC<Pick<SidePanelProps, 'presets' | 'onSavePreset' | 'onLoadPreset' | 'onDeletePreset'>> = ({ presets, onSavePreset, onLoadPreset, onDeletePreset }) => (
    <div className="p-4 flex flex-col h-full">
        <h3 className="font-orbitron text-lg font-bold tracking-wider text-cyan-300">PRESETS</h3>
        <div className="mt-4">
            <button 
                onClick={onSavePreset}
                className="w-full bg-cyan-500/10 text-cyan-300 text-sm font-bold py-2 rounded-md hover:bg-cyan-500/20 transition-colors"
            >
                Save Current
            </button>
        </div>
        <div className="flex-1 mt-4 overflow-y-auto custom-scrollbar pr-2">
            <ul>
                <AnimatePresence>
                {presets.map((preset) => (
                    <motion.li 
                        key={preset.name} 
                        className="my-1 group" 
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        layout
                    >
                        <div className="flex items-center justify-between bg-white/5 rounded-md p-2 hover:bg-white/10 transition-colors">
                        <button onClick={() => onLoadPreset(preset.name)} className="flex-1 text-left">
                            <span className="text-sm text-gray-300 group-hover:text-white">{preset.name}</span>
                        </button>
                        <button 
                            onClick={() => onDeletePreset(preset.name)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors opacity-50 group-hover:opacity-100"
                            aria-label={`Delete preset ${preset.name}`}
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                        </div>
                    </motion.li>
                ))}
                </AnimatePresence>
            </ul>
        </div>
    </div>
);

const MidiPanel: React.FC<Pick<SidePanelProps, 'midiInputs' | 'selectedMidiInput' | 'onMidiInputChange'>> = ({ midiInputs, selectedMidiInput, onMidiInputChange }) => (
    <div className="p-4 flex flex-col h-full">
         <h3 className="font-orbitron text-lg font-bold tracking-wider text-cyan-300">MIDI SETTINGS</h3>
         <div className="mt-4">
            <label htmlFor="midi-input-select" className="text-xs text-white/70 block mb-1 font-bold tracking-wider">INPUT DEVICE</label>
            <select 
                id="midi-input-select"
                value={selectedMidiInput || ''}
                onChange={(e) => onMidiInputChange(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
                <option value="">None</option>
                {midiInputs.map(input => (
                    <option key={input.id} value={input.id}>{input.name}</option>
                ))}
            </select>
        </div>
    </div>
);


export const SidePanel: React.FC<SidePanelProps> = (props) => {
    const { activePanel, setActivePanel } = props;

    return (
        <AnimatePresence>
            {activePanel && activePanel !== 'routing' && (
                <motion.div
                    key="side-panel"
                    className="fixed top-0 left-0 h-full w-64 z-[60] pt-4 pb-4 pl-4"
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <div className="relative h-full bg-gradient-to-br from-black/50 to-transparent backdrop-blur-2xl border-r border-white/20 rounded-2xl">
                        <button onClick={() => setActivePanel(null)} className="absolute top-4 right-4 p-1 text-white/50 hover:text-pink-300 group z-10 transition-colors">
                            <XIcon className="w-5 h-5 transition-all group-hover:drop-shadow-[0_0_3px_var(--glow-pink)]" />
                        </button>
                         {activePanel === 'presets' && <PresetsPanel {...props} />}
                         {activePanel === 'midi' && <MidiPanel {...props} />}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
