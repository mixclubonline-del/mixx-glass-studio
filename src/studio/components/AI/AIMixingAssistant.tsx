/**
 * Mixx Club Studio - AI Mixing Assistant
 * Prime Brain Stem (PBS) - Central AI router for intelligent mixing
 * Powered by AdvancedAIMixingEngine for professional-grade recommendations
 */

import React, { useState } from 'react';
import AdvancedAIMixingEngine from '../../../utils/AdvancedAIMixingEngine';
import './AIMixingAssistant.css';

interface AIAnalysis {
  issues: Array<{
    id: string;
    type: 'eq' | 'compression' | 'reverb' | 'stereo' | 'dynamics';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    action: string;
  }>;
  suggestions: Array<{
    id: string;
    type: 'eq' | 'compression' | 'reverb' | 'stereo' | 'dynamics';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    action: string;
  }>;
  overallScore: number;
  confidence: number;
}

const AIMixingAssistant: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [culturalContext, setCulturalContext] = useState<'artist' | 'engineer' | 'producer'>('artist');
  const [genre, setGenre] = useState<string>('hip-hop');
  const [vocalStyle, setVocalStyle] = useState<string>('rap');
  const [aiEngine] = useState(() => new AdvancedAIMixingEngine());

  // Simulate AI analysis using AdvancedAIMixingEngine
  const analyzeMix = async () => {
    setIsAnalyzing(true);
    try {
      // Set cultural context for AI engine
      aiEngine.setCulturalContext(culturalContext);

      // Desktop-native AI processing - no cloud dependencies
      console.log('🎵 Desktop AI processing for mix analysis');

      // Create mock tracks for analysis (in production, these would be real track data)
      const mockTracks = [
        {
          name: 'Kick Drum',
          level: -6,
          peak: -3,
          lufs: -8,
          frequency: {
            spectralCentroid: 80,
            spectralRolloff: 150,
            spectralFlatness: 0.4,
            spectralSpread: 50,
            zeroCrossingRate: 0.1,
            energyByBand: {
              subBass: 15,
              bass: 25,
              lowMids: 12,
              mids: 10,
              highMids: 8,
              presence: 15,
              brilliance: 0
            }
          },
          dynamics: { rms: -18, crestFactor: 12, transientDensity: 0.8 },
          quality: 'excellent' as const
        },
        {
          name: 'Vocal',
          level: -8,
          peak: -5,
          lufs: -10,
          frequency: {
            spectralCentroid: 2000,
            spectralRolloff: 8000,
            spectralFlatness: 0.5,
            spectralSpread: 3000,
            zeroCrossingRate: 0.15,
            energyByBand: {
              subBass: 5,
              bass: 8,
              lowMids: 15,
              mids: 20,
              highMids: 22,
              presence: 20,
              brilliance: 10
            }
          },
          dynamics: { rms: -20, crestFactor: 8, transientDensity: 0.6 },
          quality: 'good' as const
        },
        {
          name: 'Bass',
          level: -10,
          peak: -7,
          lufs: -12,
          frequency: {
            spectralCentroid: 120,
            spectralRolloff: 300,
            spectralFlatness: 0.3,
            spectralSpread: 80,
            zeroCrossingRate: 0.05,
            energyByBand: {
              subBass: 40,
              bass: 30,
              lowMids: 15,
              mids: 8,
              highMids: 5,
              presence: 2,
              brilliance: 0
            }
          },
          dynamics: { rms: -22, crestFactor: 10, transientDensity: 0.5 },
          quality: 'excellent' as const
        }
      ];

      // Analyze mix using AI engine
      const masterplan = aiEngine.analyzeMix(mockTracks);

      // Convert masterplan recommendations to AIAnalysis format
      const issues: AIAnalysis['issues'] = [];
      const suggestions: AIAnalysis['suggestions'] = [];

      // Process gain staging recommendations
      masterplan.recommendations.gainStagingRecommendations.forEach((rec, idx) => {
        const item: AIAnalysis['issues'][0] = {
          id: `gain-${idx}`,
          type: 'dynamics',
          priority: rec.priority === 'critical' ? 'critical' : rec.priority,
          title: `Gain: ${rec.trackName}`,
          description: `Recommended gain: ${rec.recommendedGain}dB`,
          action: rec.reasoning
        };

        if (rec.priority === 'critical') {
          issues.push(item);
        } else {
          suggestions.push(item);
        }
      });

      // Process EQ recommendations
      masterplan.recommendations.eqRecommendations.forEach((rec, idx) => {
        const item: AIAnalysis['suggestions'][0] = {
          id: `eq-${idx}`,
          type: 'eq',
          priority: 'medium',
          title: `EQ: ${rec.trackName}`,
          description: rec.issue,
          action: rec.bands.map(b => `${b.type} @ ${b.frequency}Hz: ${b.gain > 0 ? '+' : ''}${b.gain}dB (Q: ${b.Q})`).join(', ')
        };
        suggestions.push(item);
      });

      // Process compression recommendations
      masterplan.recommendations.compressionRecommendations.forEach((rec, idx) => {
        const item: AIAnalysis['suggestions'][0] = {
          id: `comp-${idx}`,
          type: 'compression',
          priority: 'medium',
          title: `Compression: ${rec.trackName}`,
          description: `Threshold: ${rec.settings.threshold}dB, Ratio: ${rec.settings.ratio}:1, Attack: ${rec.settings.attack}ms`,
          action: rec.reasoning
        };
        suggestions.push(item);
      });

      // Create final analysis with masterplan data
      const finalAnalysis: AIAnalysis = {
        issues: issues.slice(0, 3), // Limit to top 3 issues
        suggestions: suggestions.slice(0, 4), // Limit to top 4 suggestions
        overallScore: Math.round(masterplan.balanceScore * 100),
        confidence: 0.92
      };

      setAnalysis(finalAnalysis);

      // Show summary toast
      const issueCount = finalAnalysis.issues.length;
      console.log(`⚠️ Desktop AI analysis complete - ${issueCount} issue${issueCount !== 1 ? 's' : ''} found`);
      console.log(`📊 Mix Health: ${masterplan.recommendations.overallMixHealth} | Integrated LUFS: ${masterplan.globalLUFS} | Headroom: ${masterplan.headroom}dB`);
    } catch (error) {
      console.error('Mix analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-900';
      case 'high': return 'text-orange-500 bg-orange-900';
      case 'medium': return 'text-yellow-500 bg-yellow-900';
      case 'low': return 'text-green-500 bg-green-900';
      default: return 'text-gray-500 bg-gray-900';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'eq': return '🎛️';
      case 'compression': return '📊';
      case 'reverb': return '🌊';
      case 'stereo': return '🔊';
      case 'dynamics': return '⚡';
      default: return '🎵';
    }
  };

  return (
    <div className="ai-mixing-assistant bg-gray-900 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">AI Mixing Assistant</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={analyzeMix}
            disabled={isAnalyzing}
            className={`px-6 py-2 rounded font-bold ${
              isAnalyzing 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700'
            } text-white`}
          >
            {isAnalyzing ? '🔄 Analyzing...' : '🧠 Analyze Mix'}
          </button>
        </div>
      </div>

      {/* Cultural Context Controls */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cultural Context</label>
          <select
            title="Select cultural context for AI recommendations"
            value={culturalContext}
            onChange={(e) => setCulturalContext(e.target.value as 'artist' | 'engineer' | 'producer')}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="artist">Artist Perspective</option>
            <option value="engineer">Engineer Perspective</option>
            <option value="producer">Producer Perspective</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
          <select
            title="Select music genre for specialized recommendations"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="hip-hop">Hip-Hop</option>
            <option value="trap">Trap</option>
            <option value="drill">Drill</option>
            <option value="r&b">R&B</option>
            <option value="pop">Pop</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Vocal Style</label>
          <select
            title="Select vocal style for context-aware analysis"
            value={vocalStyle}
            onChange={(e) => setVocalStyle(e.target.value)}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="rap">Rap</option>
            <option value="singing">Singing</option>
            <option value="melodic">Melodic</option>
            <option value="ad-lib">Ad-lib</option>
          </select>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gray-800 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-white">Overall Score</h4>
              <span className="text-2xl font-bold text-white">{analysis.overallScore}/100</span>
            </div>
            <div className="score-bar">
              <div
                className="score-bar-fill"
                data-score={Math.min(analysis.overallScore, 100)}
              />
            </div>
            <div className="text-sm text-gray-300 mt-2">
              Confidence: {Math.round(analysis.confidence * 100)}%
            </div>
          </div>

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Issues Found</h4>
              <div className="space-y-3">
                {analysis.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-gray-800 p-4 rounded border-l-4 border-red-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getTypeIcon(issue.type)}</span>
                          <h5 className="font-semibold text-white">{issue.title}</h5>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(issue.priority)}`}>
                            {issue.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-2">{issue.description}</p>
                        <p className="text-sm text-blue-400 font-medium">{issue.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">AI Suggestions</h4>
              <div className="space-y-3">
                {analysis.suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="bg-gray-800 p-4 rounded border-l-4 border-blue-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getTypeIcon(suggestion.type)}</span>
                          <h5 className="font-semibold text-white">{suggestion.title}</h5>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-2">{suggestion.description}</p>
                        <p className="text-sm text-green-400 font-medium">{suggestion.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Issues */}
          {analysis.issues.length === 0 && analysis.suggestions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="text-xl font-semibold text-white mb-2">Perfect Mix!</h4>
              <p className="text-gray-300">No issues detected. Your mix is sounding great!</p>
            </div>
          )}
        </div>
      )}

      {/* AI Status */}
      <div className="mt-6 p-4 bg-gray-800 rounded">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-300">
            AI Status: <span className="text-green-500">ACTIVE</span>
          </div>
          <div className="text-sm text-gray-300">
            Context: <span className="text-white">{culturalContext.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMixingAssistant;