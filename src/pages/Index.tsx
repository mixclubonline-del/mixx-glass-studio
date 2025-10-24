// import { useState } from "react";

interface IndexProps {
  onNavigate: (view: string) => void;
}

const Index = ({ onNavigate }: IndexProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-white mb-4">
          Mixx Club Studio
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          The Future of Hip-Hop Production
        </p>
        
        <div className="space-x-4">
          <button
            onClick={() => onNavigate('studio')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg rounded"
          >
            🎛️ Enter Studio
          </button>
          <button
            onClick={() => onNavigate('flow-canvas')}
            className="border border-purple-400 text-purple-300 hover:bg-purple-800 px-8 py-3 text-lg rounded"
            >
              🎵 Flow Canvas
          </button>
          <button
            onClick={() => onNavigate('bloom-demo')}
            className="border border-purple-400 text-purple-300 hover:bg-purple-800 px-8 py-3 text-lg rounded"
          >
            ✨ Bloom Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
