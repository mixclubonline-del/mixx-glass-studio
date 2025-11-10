import React from 'react';
import { TrackData, MixerSettings, TrackAnalysisData, FxWindowConfig, FxWindowId } from '../../App';
import MixerChannel from './MixerChannel';
import MasterChannel from './MasterChannel';

interface MixerProps {
    tracks: TrackData[];
    mixerSettings: { [key: string]: MixerSettings };
    trackAnalysis: { [key: string]: TrackAnalysisData };
    onMixerChange: (trackId: string, setting: keyof MixerSettings, value: number | boolean) => void;
    soloedTracks: Set<string>;
    onToggleSolo: (trackId: string) => void;
    masterVolume: number;
    onMasterVolumeChange: (volume: number) => void;
    masterBalance: number;
    onBalanceChange: (balance: number) => void; // FIX: Renamed from onMasterBalanceChange
    masterAnalysis: { level: number; transient: boolean; waveform: Uint8Array };
    selectedTrackId: string | null;
    onSelectTrack: (trackId: string | null) => void;
    armedTracks: Set<string>;
    onToggleArm: (trackId: string) => void;
    onRenameTrack: (trackId: string, newName: string) => void;
    // Plugin Props
    inserts: Record<string, FxWindowId[]>;
    fxWindows: FxWindowConfig[];
    onAddPlugin: (trackId: string, pluginId: FxWindowId) => void;
    onRemovePlugin: (trackId: string, index: number) => void;
    onMovePlugin: (trackId: string, fromIndex: number, toIndex: number) => void;
    onOpenPluginBrowser: (trackId: string) => void;
    onOpenPluginSettings: (fxId: FxWindowId) => void; // Added for opening FX windows from inserts
}

const Mixer: React.FC<MixerProps> = (props) => {
    return (
        <div className="w-full h-full flex items-center justify-center p-8 overflow-x-auto">
            <div className="flex items-stretch justify-center h-full gap-x-4">
                {props.tracks.map(track => (
                    <MixerChannel
                        key={track.id}
                        track={track}
                        settings={props.mixerSettings[track.id]}
                        analysis={props.trackAnalysis[track.id] || { level: 0, transient: false }}
                        onMixerChange={props.onMixerChange}
                        isSoloed={props.soloedTracks.has(track.id)}
                        onToggleSolo={props.onToggleSolo}
                        selectedTrackId={props.selectedTrackId}
                        onSelectTrack={props.onSelectTrack}
                        isArmed={props.armedTracks.has(track.id)}
                        onToggleArm={props.onToggleArm}
                        onRenameTrack={props.onRenameTrack}
                        // Plugin Props
                        inserts={props.inserts[track.id] || []}
                        trackColor={track.trackColor}
                        fxWindows={props.fxWindows}
                        onAddPlugin={(pluginId) => props.onAddPlugin(track.id, pluginId)}
                        onRemovePlugin={(index) => props.onRemovePlugin(track.id, index)}
                        onMovePlugin={(from, to) => props.onMovePlugin(track.id, from, to)}
                        onOpenPluginBrowser={() => props.onOpenPluginBrowser(track.id)}
                        onOpenPluginSettings={props.onOpenPluginSettings}
                    />
                ))}
                <div className="w-10 flex-shrink-0" /> 
                <MasterChannel
                    volume={props.masterVolume}
                    onVolumeChange={props.onMasterVolumeChange}
                    balance={props.masterBalance} 
                    onBalanceChange={props.onBalanceChange} // FIX: onBalanceChange prop
                    analysis={props.masterAnalysis}
                />
            </div>
        </div>
    );
};

export default Mixer;