/**
 * Mixx Club Studio - Track Management System
 * Professional track list with advanced features
 */

import React, { useState } from 'react';
// import { useTransport } from '../../../contexts/ProjectContext';

interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'bus' | 'aux';
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  color: string;
}

const TrackList: React.FC = () => {
  // const { isPlaying, isRecording } = useTransport();
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: '1',
      name: 'Kick',
      type: 'audio',
      volume: 0.8,
      pan: 0,
      mute: false,
      solo: false,
      color: '#ff6b6b'
    },
    {
      id: '2',
      name: 'Snare',
      type: 'audio',
      volume: 0.7,
      pan: 0,
      mute: false,
      solo: false,
      color: '#4ecdc4'
    },
    {
      id: '3',
      name: 'Hi-Hat',
      type: 'audio',
      volume: 0.6,
      pan: 0,
      mute: false,
      solo: false,
      color: '#45b7d1'
    }
  ]);

  const addTrack = (type: Track['type']) => {
    const newTrack: Track = {
      id: Date.now().toString(),
      name: `Track ${tracks.length + 1}`,
      type,
      volume: 0.8,
      pan: 0,
      mute: false,
      solo: false,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };
    setTracks([...tracks, newTrack]);
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(tracks.map(track => 
      track.id === id ? { ...track, ...updates } : track
    ));
  };

  const deleteTrack = (id: string) => {
    setTracks(tracks.filter(track => track.id !== id));
  };

  return (
    <div className="track-list bg-gray-900 border-r border-gray-700 w-80 flex flex-col">
      {/* Track List Header */}
      <div className="track-header bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Tracks</h3>
          <div className="flex gap-2">
            <button
              onClick={() => addTrack('audio')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
            >
              + Audio
            </button>
            <button
              onClick={() => addTrack('midi')}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
            >
              + MIDI
            </button>
            <button
              onClick={() => addTrack('bus')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
            >
              + Bus
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="track-list-content flex-1 overflow-y-auto">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="track-item border-b border-gray-700 p-4 hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              {/* Track Color Indicator */}
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: track.color }}
              />
              
              {/* Track Name */}
              <div className="flex-1">
                <input
                  type="text"
                  value={track.name}
                  onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                  className="bg-transparent text-white font-medium w-full"
                />
                <div className="text-xs text-gray-400 capitalize">{track.type}</div>
              </div>

              {/* Track Controls */}
              <div className="flex items-center gap-2">
                {/* Mute/Solo */}
                <button
                  onClick={() => updateTrack(track.id, { mute: !track.mute })}
                  className={`w-8 h-8 rounded text-xs font-bold ${
                    track.mute ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => updateTrack(track.id, { solo: !track.solo })}
                  className={`w-8 h-8 rounded text-xs font-bold ${
                    track.solo ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  S
                </button>

                {/* Volume */}
                <div className="flex items-center gap-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={track.volume}
                    onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
                    className="w-16"
                  />
                  <span className="text-white text-xs w-8">
                    {Math.round(track.volume * 100)}%
                  </span>
                </div>

                {/* Pan */}
                <div className="flex items-center gap-1">
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={track.pan}
                    onChange={(e) => updateTrack(track.id, { pan: parseFloat(e.target.value) })}
                    className="w-16"
                  />
                  <span className="text-white text-xs w-8">
                    {track.pan > 0 ? `R${Math.round(track.pan * 100)}` : 
                     track.pan < 0 ? `L${Math.round(Math.abs(track.pan) * 100)}` : 'C'}
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteTrack(track.id)}
                  className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Track List Footer */}
      <div className="track-footer bg-gray-800 p-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          {tracks.length} track{tracks.length !== 1 ? 's' : ''} | 
          {tracks.filter(t => t.mute).length} muted | 
          {tracks.filter(t => t.solo).length} soloed
        </div>
      </div>
    </div>
  );
};

export default TrackList;
