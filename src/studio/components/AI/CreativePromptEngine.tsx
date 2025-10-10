/**
 * Creative Prompt & Style Engine
 * Genre selector, mood wheel, flow energy controls
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IceFireKnob } from '../Controls/IceFireKnob';
import { Sparkles, Music2 } from 'lucide-react';

interface CreativePromptEngineProps {
  onGenerate: (prompt: string, genre: string, mood: string, energy: number) => void;
  isGenerating: boolean;
}

const GENRES = [
  { id: 'modern-hiphop', name: 'Modern Hip-Hop', bpm: '85-95', color: 'from-purple-500 to-purple-700' },
  { id: 'trap', name: 'Trap Soul', bpm: '130-150', color: 'from-pink-500 to-pink-700' },
  { id: 'rnb', name: 'Contemporary R&B', bpm: '70-90', color: 'from-blue-500 to-blue-700' },
  { id: 'drill', name: 'Drill', bpm: '140-160', color: 'from-red-500 to-red-700' },
  { id: 'melodic-trap', name: 'Melodic Trap', bpm: '140-150', color: 'from-cyan-500 to-cyan-700' },
  { id: 'neo-soul', name: 'Neo-Soul Fusion', bpm: '80-100', color: 'from-amber-500 to-amber-700' }
];

const MOODS = [
  { id: 'aggressive', name: 'Aggressive', emoji: '🔥' },
  { id: 'chill', name: 'Chill', emoji: '😌' },
  { id: 'emotional', name: 'Emotional', emoji: '💔' },
  { id: 'energetic', name: 'Energetic', emoji: '⚡' },
  { id: 'dark', name: 'Dark', emoji: '🌑' },
  { id: 'uplifting', name: 'Uplifting', emoji: '✨' }
];

export const CreativePromptEngine: React.FC<CreativePromptEngineProps> = ({
  onGenerate,
  isGenerating
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('trap');
  const [selectedMood, setSelectedMood] = useState('energetic');
  const [energy, setEnergy] = useState(70);

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt, selectedGenre, selectedMood, energy);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <Music2 size={20} className="text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Creative Prompt & Style Engine</h3>
          <p className="text-xs text-muted-foreground">Describe your vision • Select genre & mood</p>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Creative Concept</Label>
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Dark trap beat with emotional piano and heavy 808s..."
          className="glass border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
          disabled={isGenerating}
        />
      </div>

      {/* Genre Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Genre Model</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              disabled={isGenerating}
              className={`p-3 rounded-xl border-2 transition-all ${
                selectedGenre === genre.id
                  ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)] bg-primary/10'
                  : 'border-border/30 hover:border-primary/30 glass'
              }`}
            >
              <div className={`text-xs font-bold bg-gradient-to-r ${genre.color} bg-clip-text text-transparent`}>
                {genre.name}
              </div>
              <div className="text-[0.65rem] text-muted-foreground mt-1">{genre.bpm} BPM</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mood & Energy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Mood</Label>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                disabled={isGenerating}
                className={`p-3 rounded-xl border transition-all ${
                  selectedMood === mood.id
                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                    : 'border-border/30 hover:border-primary/30 glass'
                }`}
              >
                <div className="text-2xl mb-1">{mood.emoji}</div>
                <div className="text-xs font-medium text-foreground">{mood.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Flow Energy Knob */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Flow Energy</Label>
          <div className="flex flex-col items-center justify-center h-full">
            <IceFireKnob
              value={energy}
              onChange={setEnergy}
              size={80}
              label="Energy"
            />
            <div className="text-xs text-muted-foreground mt-2">{energy}%</div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 hover:from-purple-500 hover:via-pink-400 hover:to-blue-400 text-white font-bold text-base shadow-[0_0_30px_hsl(var(--primary)/0.5)] disabled:opacity-50 disabled:cursor-not-allowed animate-[pulse_3s_ease-in-out_infinite]"
      >
        <Sparkles size={20} className="mr-2" />
        {isGenerating ? 'Generating Track...' : 'Generate Track'}
      </Button>
    </div>
  );
};
