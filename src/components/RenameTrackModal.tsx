import React, { useState } from 'react';

interface RenameTrackModalProps {
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

const RenameTrackModal: React.FC<RenameTrackModalProps> = ({ currentName, onClose, onRename }) => {
  const [newName, setNewName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onRename(newName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-filter backdrop-blur-md" onClick={onClose}>
      <div 
        className="relative w-80 rounded-2xl bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-gray-100/20 flex flex-col p-6 shadow-2xl shadow-violet-500/20" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold tracking-widest text-gray-200 mb-4 text-center">RENAME TRACK</h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-2 rounded bg-black/30 border border-gray-100/20 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow text-white"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors">Rename</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameTrackModal;