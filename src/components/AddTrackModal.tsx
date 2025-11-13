
import React, { useState } from 'react';
import { TrackData } from '../App';

type NewTrackData = Pick<TrackData, 'trackName' | 'trackColor' | 'waveformType' | 'group'>;

interface AddTrackModalProps {
  onClose: () => void;
  onAddTrack: (trackData: NewTrackData) => void;
}

const AddTrackModal: React.FC<AddTrackModalProps> = ({ onClose, onAddTrack }) => {
  const [trackName, setTrackName] = useState('');
  const [trackColor, setTrackColor] = useState<TrackData['trackColor']>('cyan');
  const [waveformType, setWaveformType] = useState<TrackData['waveformType']>('varied');
  const [group, setGroup] = useState<TrackData['group']>('Vocals');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackName.trim()) {
      // Simple validation
      alert('Track name cannot be empty.');
      return;
    }
    onAddTrack({
      trackName: trackName.trim().toUpperCase(),
      trackColor,
      waveformType,
      group,
    });
  };
  
  const formInputStyle = "w-full p-2 rounded bg-black/30 border border-gray-100/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow";

  return (
    <div className="fixed inset-0 bg-black/70
    flex items-center justify-center z-[100] backdrop-filter backdrop-blur-md" onClick={onClose}>
      <div 
        className="relative w-96 rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/50 flex flex-col p-6 shadow-2xl shadow-indigo-500/20" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold tracking-widest text-gray-200 mb-6 text-center">ADD NEW TRACK</h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label htmlFor="trackName" className="block text-sm font-medium text-gray-400 mb-1">Track Name</label>
            <input
              type="text"
              id="trackName"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              className={formInputStyle}
              placeholder="e.g., LEAD VOCALS"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="trackColor" className="block text-sm font-medium text-gray-400 mb-1">Color</label>
            <select
              id="trackColor"
              value={trackColor}
              onChange={(e) => setTrackColor(e.target.value as TrackData['trackColor'])}
              className={formInputStyle}
            >
              <option value="cyan">Cyan</option>
              <option value="magenta">Magenta</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="crimson">Crimson</option>
            </select>
          </div>
          <div>
            <label htmlFor="waveformType" className="block text-sm font-medium text-gray-400 mb-1">Waveform Style</label>
            <select
              id="waveformType"
              value={waveformType}
              onChange={(e) => setWaveformType(e.target.value as TrackData['waveformType'])}
              className={formInputStyle}
            >
              <option value="varied">Varied</option>
              <option value="dense">Dense</option>
              <option value="sparse">Sparse</option>
              <option value="bass">Bass</option>
            </select>
          </div>
          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-400 mb-1">Group</label>
            <select
              id="group"
              value={group}
              onChange={(e) => setGroup(e.target.value as TrackData['group'])}
              className={formInputStyle}
            >
              <option value="Vocals">Vocals</option>
              <option value="Harmony">Harmony</option>
              <option value="Adlibs">Adlibs</option>
              <option value="Bass">Bass</option>
              <option value="Drums">Drums</option>
              <option value="Instruments">Instruments</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-[0_0_10px_rgba(99,102,241,0.5)]">
              Add Track
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTrackModal;