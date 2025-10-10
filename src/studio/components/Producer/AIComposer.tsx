/**
 * AI Composer - AI-assisted composition with contextual awareness
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AIComposer: React.FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI composition
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'Composition Generated',
      description: 'MIDI pattern added to timeline',
    });
    
    setIsGenerating(false);
    setPrompt('');
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">AI Composer</h3>
        <Badge variant="outline" className="gap-1">
          <Sparkles size={10} className="text-cyan-400" />
          <span className="text-xs">PrimeBot</span>
        </Badge>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <Textarea
          placeholder="Describe the musical idea... (e.g., 'dark trap melody in Am', '808 bassline with slides')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="glass flex-1 resize-none text-sm"
        />

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Context-aware generation based on:
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">140 BPM</Badge>
            <Badge variant="secondary" className="text-xs">A Minor</Badge>
            <Badge variant="secondary" className="text-xs">Trap</Badge>
          </div>
        </div>

        <Button
          className="w-full gap-2"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <>
              <Sparkles size={14} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={14} />
              Generate MIDI
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
