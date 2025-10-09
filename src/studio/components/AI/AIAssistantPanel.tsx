/**
 * AI Assistant Panel - Context-aware AI suggestions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, SendHorizontal, Lightbulb, Wand2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  type: 'mix' | 'arrangement' | 'effect' | 'creative';
  title: string;
  description: string;
  action?: () => void;
}

const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: '1',
    type: 'mix',
    title: 'Compress Track 4',
    description: 'The vocals on Track 4 have inconsistent levels. Try adding a compressor with 4:1 ratio.',
  },
  {
    id: '2',
    type: 'arrangement',
    title: 'Add Variation at Bar 8',
    description: 'The arrangement feels repetitive. Consider adding a filter sweep or breakdown at bar 8.',
  },
  {
    id: '3',
    type: 'effect',
    title: 'Apply Reverb to Track 2',
    description: 'Track 2 sounds dry. A subtle plate reverb would add depth without losing clarity.',
  },
  {
    id: '4',
    type: 'creative',
    title: 'Try MixxTune on Vocals',
    description: 'Your vocal pitch varies slightly. MixxTune AI can intelligently correct it while preserving natural expression.',
  },
];

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>(MOCK_SUGGESTIONS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSuggestions([
      {
        id: Date.now().toString(),
        type: 'mix',
        title: 'AI Mix Suggestion',
        description: 'Based on your request: "' + prompt + '", I recommend adjusting the low-end EQ and adding subtle sidechain compression.',
      },
      ...suggestions,
    ]);
    
    setPrompt('');
    setIsAnalyzing(false);
  };
  
  const getBadgeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'mix': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'arrangement': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'effect': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'creative': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };
  
  const getIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'mix': return Wand2;
      case 'arrangement': return Lightbulb;
      case 'effect': return Sparkles;
      case 'creative': return Sparkles;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed right-4 top-20 bottom-20 w-96 bg-background/95 backdrop-blur-lg border border-border rounded-lg shadow-2xl flex flex-col z-50 animate-slide-in-right">
      {/* Header */}
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Context Info */}
      <div className="px-4 py-3 border-b border-border/30 bg-primary/5">
        <div className="text-xs text-muted-foreground mb-1">Analyzing Project</div>
        <div className="text-sm font-medium">5 tracks • 120 BPM • 4/4</div>
      </div>
      
      {/* Suggestions */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const Icon = getIcon(suggestion.type);
            return (
              <div
                key={suggestion.id}
                className="p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium">{suggestion.title}</div>
                      <Badge className={cn("text-[10px] px-1.5 py-0", getBadgeColor(suggestion.type))}>
                        {suggestion.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-muted/30">
        <div className="relative">
          <Textarea
            placeholder="Ask AI about your mix..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="pr-12 min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (prompt.trim()) handleAnalyze();
              }
            }}
          />
          <Button
            size="sm"
            className="absolute right-2 bottom-2 h-8 w-8 p-0"
            disabled={!prompt.trim() || isAnalyzing}
            onClick={handleAnalyze}
          >
            {isAnalyzing ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendHorizontal className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
