/**
 * Mix Analysis Panel - AI-powered mix insights
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisItem {
  id: string;
  category: 'balance' | 'frequency' | 'dynamics' | 'stereo';
  severity: 'info' | 'warning' | 'good';
  title: string;
  description: string;
  score: number;
}

export const MixAnalysisPanel: React.FC = () => {
  const [overallScore, setOverallScore] = useState(72);
  const [analysisItems, setAnalysisItems] = useState<AnalysisItem[]>([]);
  
  useEffect(() => {
    // Simulate analysis results
    const items: AnalysisItem[] = [
      {
        id: '1',
        category: 'balance',
        severity: 'good',
        title: 'Level Balance',
        description: 'Overall track levels are well-balanced',
        score: 85,
      },
      {
        id: '2',
        category: 'frequency',
        severity: 'warning',
        title: 'Low-Mid Buildup',
        description: 'Frequency masking detected around 250-400Hz',
        score: 65,
      },
      {
        id: '3',
        category: 'dynamics',
        severity: 'good',
        title: 'Dynamic Range',
        description: 'Good dynamic range preserved (12 LU)',
        score: 88,
      },
      {
        id: '4',
        category: 'stereo',
        severity: 'warning',
        title: 'Stereo Width',
        description: 'Some elements could benefit from wider stereo image',
        score: 68,
      },
      {
        id: '5',
        category: 'frequency',
        severity: 'info',
        title: 'High Frequency Energy',
        description: 'High frequencies are present but could be boosted slightly',
        score: 72,
      },
      {
        id: '6',
        category: 'balance',
        severity: 'good',
        title: 'Pan Distribution',
        description: 'Elements are well distributed across the stereo field',
        score: 90,
      },
    ];
    
    setAnalysisItems(items);
  }, []);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'good':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };
  
  const getCategoryBadge = (category: string) => {
    const colors = {
      balance: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      frequency: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      dynamics: 'bg-green-500/20 text-green-400 border-green-500/30',
      stereo: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    
    return colors[category as keyof typeof colors] || '';
  };
  
  return (
    <Card className="glass border-primary/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold gradient-flow">Mix Analysis</h3>
          <p className="text-xs text-muted-foreground">AI-Powered Insights</p>
        </div>
        <TrendingUp className="w-5 h-5 text-primary animate-pulse" />
      </div>
      
      {/* Overall Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Overall Mix Quality</span>
          <span className={cn("text-3xl font-bold font-mono", getScoreColor(overallScore))}>
            {overallScore}
            <span className="text-sm text-muted-foreground">/100</span>
          </span>
        </div>
        <Progress value={overallScore} className="h-2" />
      </div>
      
      {/* Category Scores */}
      <div className="grid grid-cols-2 gap-2">
        {['Balance', 'Frequency', 'Dynamics', 'Stereo'].map((cat, i) => {
          const score = [87, 68, 88, 69][i];
          return (
            <div key={cat} className="glass-glow rounded p-2 space-y-1">
              <div className="text-xs text-muted-foreground">{cat}</div>
              <div className={cn("text-xl font-bold font-mono", getScoreColor(score))}>
                {score}
              </div>
              <Progress value={score} className="h-1" />
            </div>
          );
        })}
      </div>
      
      {/* Analysis Items */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {analysisItems.map((item) => (
            <div
              key={item.id}
              className="glass-glow rounded p-3 space-y-2 border border-border/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  {getSeverityIcon(item.severity)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-xs", getCategoryBadge(item.category))}>
                  {item.category}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Progress value={item.score} className="h-1 flex-1" />
                <span className={cn("text-xs font-mono", getScoreColor(item.score))}>
                  {item.score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
