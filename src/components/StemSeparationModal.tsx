
import React, { useState } from 'react';

interface StemSeparationModalProps {
  onClose: () => void;
  onSeparate: (selectedStems: string[]) => void;
}

const availableStems = [
    'Vocals', 'Lead Vocals', 'Backing Vocals',
    'Drums', 'Bass', 'Guitar', 'Piano', 'Synths', 'Strings',
    'Other Instruments', 'Sound FX',
];

const StemSeparationModal: React.FC<StemSeparationModalProps> = ({ onClose, onSeparate }) => {
  const [selectedStems, setSelectedStems] = useState<Set<string>>(new Set(['Vocals', 'Drums', 'Bass', 'Other Instruments']));

  const handleToggleStem = (stem: string) => {
    setSelectedStems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stem)) {
        newSet.delete(stem);
      } else {
        newSet.add(stem);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStems.size === 0) {
      alert('Please select at least one stem to separate.');
      return;
    }
    onSeparate(Array.from(selectedStems));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-filter backdrop-blur-md" onClick={onClose}>
      <div 
        className="relative w-[500px] max-h-[80vh] rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/50 flex flex-col p-6 shadow-2xl shadow-indigo-500/20" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold tracking-widest text-gray-200 mb-2 text-center">DYNAMIC STEM SEPARATION</h2>
        <p className="text-sm text-gray-400 mb-6 text-center">Select the stems you wish to extract from the source audio.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pr-4 overflow-y-auto">
            {availableStems.map(stem => (
              <label key={stem} className="flex items-center space-x-3 p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStems.has(stem)}
                  onChange={() => handleToggleStem(stem)}
                  className="w-5 h-5 rounded bg-black/30 border-gray-100/30 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                />
                <span className="text-gray-300">{stem}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end space-x-4 pt-6 mt-auto border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-[0_0_10px_rgba(99,102,241,0.5)]">
              Separate ({selectedStems.size}) Stems
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StemSeparationModal;