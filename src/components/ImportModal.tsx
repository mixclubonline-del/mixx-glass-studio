
import React from 'react';

interface ImportModalProps {
  message: string;
}

const ImportModal: React.FC<ImportModalProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-filter backdrop-blur-md">
      <div className="relative w-80 h-40 rounded-2xl bg-gradient-to-br from-fuchsia-900/50 to-indigo-900/50 border border-fuchsia-500/50 flex flex-col items-center justify-center p-6 text-center shadow-2xl shadow-fuchsia-500/20">
        <div className="absolute inset-0 w-full h-full overflow-hidden rounded-2xl">
            {/* Animated background noise */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%200h40v40H0z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10 animate-[pulse_5s_infinite]"></div>
        </div>
        
        <div className="relative flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-cyan-200 font-mono text-sm tracking-wide">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;