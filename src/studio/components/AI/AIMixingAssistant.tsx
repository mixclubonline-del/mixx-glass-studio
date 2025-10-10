/**
 * AI Mixing Assistant - Real-time mix analysis and suggestions
 * Uses Lovable AI to provide intelligent mixing recommendations
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Volume2,
  Waves,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MixAnalysis {
  issues: MixIssue[];
  suggestions: MixSuggestion[];
  score: number;
  lufs: number;
  dynamicRange: number;
}

interface MixIssue {
  type: 'frequency-masking' | 'phase' | 'dynamics' | 'stereo' | 'loudness';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedTracks: string[];
}

interface MixSuggestion {
  action: string;
  details: string;
  priority: number;
  trackId?: string;
}

export function AIMixingAssistant() {
  const [analysis, setAnalysis] = useState<MixAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);

  const analyzeMix = async () => {
    setIsAnalyzing(true);
    
    try {
      // In real implementation, extract audio features from all tracks
      const mixFeatures = {
        tracks: [], // Audio buffer data
        lufs: -14.2,
        peakLevel: -0.3,
        dynamicRange: 8.5,
        spectralBalance: { low: 0.35, mid: 0.45, high: 0.20 },
        stereoWidth: 0.75,
        phaseCorrelation: 0.85,
      };

      const { data, error } = await supabase.functions.invoke('analyze-mix-ai', {
        body: mixFeatures,
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      
      // Show summary toast
      const issueCount = data.analysis.issues.length;
      if (issueCount === 0) {
        toast.success('Mix analysis complete - No issues detected!');
      } else {
        toast.warning(`Mix analysis complete - ${issueCount} issue${issueCount > 1 ? 's' : ''} found`);
      }
    } catch (error) {
      console.error('Mix analysis error:', error);
      toast.error('Failed to analyze mix');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-analyze on playback changes (if enabled)
  useEffect(() => {
    if (!autoAnalyze) return;
    
    const interval = setInterval(() => {
      analyzeMix();
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [autoAnalyze]);

  const getSeverityColor = (severity: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'frequency-masking': return Waves;
      case 'phase': return Activity;
      case 'dynamics': return TrendingUp;
      case 'stereo': return Volume2;
      case 'loudness': return Zap;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="h-full flex flex-col glass rounded-lg border border-border/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">AI Mixing Assistant</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoAnalyze(!autoAnalyze)}
          >
            {autoAnalyze ? 'Auto: ON' : 'Auto: OFF'}
          </Button>
          <Button
            onClick={analyzeMix}
            disabled={isAnalyzing}
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyze Mix
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {!analysis && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Brain className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              AI-powered mix analysis ready
            </p>
            <p className="text-xs text-muted-foreground">
              Click "Analyze Mix" to get intelligent suggestions
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full">
            <Activity className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">
              Analyzing your mix with AI...
            </p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Mix Score */}
            <Card className="p-4 glass border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Mix Quality Score</span>
                <Badge variant={analysis.score >= 80 ? 'default' : analysis.score >= 60 ? 'secondary' : 'destructive'}>
                  {analysis.score}/100
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">LUFS:</span>
                  <span className="ml-2 font-mono text-foreground">{analysis.lufs.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dynamic Range:</span>
                  <span className="ml-2 font-mono text-foreground">{analysis.dynamicRange.toFixed(1)} dB</span>
                </div>
              </div>
            </Card>

            {/* Issues */}
            {analysis.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Detected Issues ({analysis.issues.length})
                </h4>
                <div className="space-y-2">
                  {analysis.issues.map((issue, i) => {
                    const Icon = getIssueIcon(issue.type);
                    return (
                      <Card key={i} className="p-3 glass border-border/30">
                        <div className="flex items-start gap-3">
                          <Icon className="w-4 h-4 text-destructive mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-foreground">
                                {issue.type.replace('-', ' ').toUpperCase()}
                              </span>
                              <Badge variant={getSeverityColor(issue.severity)} className="text-xs">
                                {issue.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {issue.description}
                            </p>
                            {issue.affectedTracks.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {issue.affectedTracks.map((track, j) => (
                                  <Badge key={j} variant="outline" className="text-xs">
                                    {track}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  AI Suggestions ({analysis.suggestions.length})
                </h4>
                <div className="space-y-2">
                  {analysis.suggestions
                    .sort((a, b) => b.priority - a.priority)
                    .map((suggestion, i) => (
                      <Card key={i} className="p-3 glass border-primary/20">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-foreground">
                                {suggestion.action}
                              </span>
                              <Badge className="text-xs">
                                Priority {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {suggestion.details}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {analysis.issues.length === 0 && analysis.suggestions.length === 0 && (
              <Card className="p-6 glass border-primary/20 text-center">
                <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Mix sounds great!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No issues detected. Your mix is well balanced.
                </p>
              </Card>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
