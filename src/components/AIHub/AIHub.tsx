// components/AIHub/AIHub.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XIcon, ChatIcon, ImageIcon, MicrophoneIcon, BulbIcon, SlidersIcon } from '../icons'; // Added SlidersIcon
import AIChatbot from './AIChatbot';
import ImageGenerator from './ImageGenerator';
import ImageAnalyzer from './ImageAnalyzer';
import AudioProcessor from './AudioProcessor';
import AIMasteringAssistant from './AIMasteringAssistant'; // Import new component
import { ArrangeClip } from '../../hooks/useArrange';
import { TrackData } from '../../App';

interface AIHubProps {
  onClose: () => void;
  audioContext: AudioContext | null;
  clips: ArrangeClip[];
  tracks: TrackData[];
  selectedTrackId: string | null;
}

type Tab = 'chat' | 'image-gen' | 'image-analyze' | 'audio-process' | 'mastering-assistant'; // Added new tab type

const AIHub: React.FC<AIHubProps> = ({ onClose, audioContext, clips, tracks, selectedTrackId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const hubRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hubRef.current && !hubRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return <AIChatbot />;
      case 'image-gen':
        return <ImageGenerator />;
      case 'image-analyze':
        return <ImageAnalyzer clips={clips} tracks={tracks} selectedTrackId={selectedTrackId} />;
      case 'audio-process':
        return <AudioProcessor audioContext={audioContext} />;
      case 'mastering-assistant': // New tab content
        return <AIMasteringAssistant audioContext={audioContext} />;
      default:
        return null;
    }
  };

  const tabButtonStyle = (tabName: Tab) => `
    flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
    ${activeTab === tabName ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}
  `;

  const tabIconClass = `w-5 h-5`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-filter backdrop-blur-lg" onClick={onClose}>
      <div 
        ref={hubRef}
        className="relative w-[90vw] max-w-5xl h-[90vh] max-h-[800px] rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/50 flex flex-col shadow-2xl shadow-indigo-500/20 overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex items-center justify-between p-4 bg-indigo-900/40 border-b border-indigo-500/50">
          <h2 className="text-2xl font-bold tracking-widest text-gray-100">AI HUB</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <nav className="flex-shrink-0 flex space-x-1 p-2 bg-indigo-900/30">
          <button onClick={() => setActiveTab('chat')} className={tabButtonStyle('chat')}>
            <ChatIcon className={tabIconClass} /> <span>Chatbot</span>
          </button>
          <button onClick={() => setActiveTab('image-gen')} className={tabButtonStyle('image-gen')}>
            <ImageIcon className={tabIconClass} /> <span>Generate Image</span>
          </button>
          <button onClick={() => setActiveTab('image-analyze')} className={tabButtonStyle('image-analyze')}>
            <BulbIcon className={tabIconClass} /> <span>Analyze Image</span>
          </button>
          <button onClick={() => setActiveTab('audio-process')} className={tabButtonStyle('audio-process')}>
            <MicrophoneIcon className={tabIconClass} /> <span>Audio AI</span>
          </button>
          <button onClick={() => setActiveTab('mastering-assistant')} className={tabButtonStyle('mastering-assistant')}>
            <SlidersIcon className={tabIconClass} /> <span>Mastering Assistant</span>
          </button>
        </nav>

        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AIHub;