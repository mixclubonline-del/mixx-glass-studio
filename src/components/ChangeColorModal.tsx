// FIX: Corrected a syntax error in the import statement.
import React, { useState } from 'react';
import { TrackData } from '../App';

interface ChangeColorModalProps {
  currentColor: TrackData['trackColor'];
  onClose: () => void;
  onChangeColor: (newColor: TrackData['trackColor']) => void;
}

const colors: TrackData['trackColor'][] = ['cyan', 'magenta', 'blue', 'green', 'purple'];

const ChangeColorModal: React.FC<ChangeColorModalProps> = ({ currentColor, onClose, onChangeColor }) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);

  const handleSubmit = () => {
      onChangeColor(selectedColor);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-filter backdrop-blur-md" onClick={onClose}>
      <div 
        className="relative w-96 rounded-2xl bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-gray-100/20 flex flex-col p-6 shadow-2xl shadow-violet-500/20" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold tracking-widest text-gray-200 mb-6 text-center">CHANGE TRACK COLOR</h2>
        
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div onClick={() => setSelectedColor('cyan')} className={`w-10 h-10 rounded-full bg-cyan-500 cursor-pointer transition-all ${selectedColor === 'cyan' ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}></div>
          <div onClick={() => setSelectedColor('magenta')} className={`w-10 h-10 rounded-full bg-fuchsia-500 cursor-pointer transition-all ${selectedColor === 'magenta' ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}></div>
          <div onClick={() => setSelectedColor('blue')} className={`w-10 h-10 rounded-full bg-blue-500 cursor-pointer transition-all ${selectedColor === 'blue' ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}></div>
          <div onClick={() => setSelectedColor('green')} className={`w-10 h-10 rounded-full bg-green-500 cursor-pointer transition-all ${selectedColor === 'green' ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}></div>
          <div onClick={() => setSelectedColor('purple')} className={`w-10 h-10 rounded-full bg-violet-500 cursor-pointer transition-all ${selectedColor === 'purple' ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}></div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors">Set Color</button>
        </div>
      </div>
    </div>
  );
};

export default ChangeColorModal;