/**
 * Mixx AI Studio - Hybrid Hip-Hop/Trap/R&B Creative Intelligence Core
 * Next-gen AI music production lab for co-creation
 */

import React, { useState } from 'react';
import { CreativePromptEngine } from './CreativePromptEngine';
import { VocalIntelligenceZone } from './VocalIntelligenceZone';
import { MixxOutputConsole } from './MixxOutputConsole';
import { Card } from '@/components/ui/card';
import mixxclubLogo from '@/assets/mixxclub-logo.png';
import { Sparkles } from 'lucide-react';

export interface AITrackData {
  stems: {
    drums: string;
    bass: string;
    melody: string;
    vocals: string;
    fx: string;
  };
  bpm: number;
  key: string;
  genre: string;
  mood: string;
  timestamp: number;
}

export const MixxAIStudio: React.FC = () => {
  const [generatedTrack, setGeneratedTrack] = useState<AITrackData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [vocalData, setVocalData] = useState<{
    audioBlob?: Blob;
    waveform?: number[];
  } | null>(null);

  const handleGenerate = async (prompt: string, genre: string, mood: string, energy: number) => {
    setIsGenerating(true);
    
    // Simulate AI generation (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockTrack: AITrackData = {
      stems: {
        drums: '/mock/drums.wav',
        bass: '/mock/bass.wav',
        melody: '/mock/melody.wav',
        vocals: vocalData ? '/mock/processed-vocals.wav' : '/mock/ai-vocals.wav',
        fx: '/mock/fx.wav'
      },
      bpm: genre === 'trap' ? 140 : genre === 'drill' ? 150 : 85,
      key: 'Am',
      genre,
      mood,
      timestamp: Date.now()
    };
    
    setGeneratedTrack(mockTrack);
    setIsGenerating(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-600/10 via-pink-500/10 to-blue-500/10">
      {/* Header */}
      <div className="px-4 py-3 glass border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={mixxclubLogo} 
            alt="MixxClub AI Studio" 
            className="h-8 w-auto logo-glow" 
          />
          <div className="border-l border-border/30 h-7"></div>
          <div>
            <h2 className="text-base font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Mixx AI Studio
            </h2>
            <p className="text-[0.7rem] text-muted-foreground">
              Hybrid Hip-Hop • Trap • R&B Creative Engine
            </p>
          </div>
        </div>
        
        {isGenerating && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40 animate-pulse">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400">PrimeBot Active</span>
          </div>
        )}
      </div>

      {/* Main Content - Three Stacked Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Section 1: Creative Prompt & Style Engine */}
        <Card className="glass-glow border-border/30">
          <CreativePromptEngine 
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </Card>

        {/* Section 2: Vocal Intelligence Zone */}
        <Card className="glass-glow border-border/30">
          <VocalIntelligenceZone 
            onVocalData={setVocalData}
            isGenerating={isGenerating}
          />
        </Card>

        {/* Section 3: Mixx Output Console */}
        {generatedTrack && (
          <Card className="glass-glow border-border/30">
            <MixxOutputConsole 
              trackData={generatedTrack}
              onRegenerate={() => setGeneratedTrack(null)}
            />
          </Card>
        )}
      </div>
    </div>
  );
};
