import React from 'react';

interface MasteringModalProps {
  onClose: () => void;
}

const MasteringModal: React.FC<MasteringModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-filter backdrop-blur-md" onClick={onClose}>
      <div 
        className="relative w-[500px] h-[400px] rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/50 flex flex-col p-6 shadow-2xl shadow-indigo-500/20" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold tracking-widest text-gray-200 mb-6 text-center">MASTERING SUITE</h2>
        <p className="text-gray-400 text-center flex-grow">
          This will be our AI-powered mastering suite, contextually adapting your mix for optimal deployment.
        </p>
        <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

export default MasteringModal;