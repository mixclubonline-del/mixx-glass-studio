/**
 * Mixx Club Studio - Bloom Menu System
 * Cultural intelligence that adapts to Artist/Engineer/Producer perspectives
 */

import React, { useState, useEffect } from 'react';

interface BloomContext {
  role: 'artist' | 'engineer' | 'producer';
  mood: 'creative' | 'technical' | 'analytical';
  focus: 'writing' | 'recording' | 'mixing' | 'mastering';
  genre: string;
  experience: 'beginner' | 'intermediate' | 'expert';
}

interface BloomSuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  category: 'workflow' | 'technical' | 'creative' | 'inspiration';
  icon: string;
}

const BloomMenu: React.FC = () => {
  const [context, setContext] = useState<BloomContext>({
    role: 'artist',
    mood: 'creative',
    focus: 'writing',
    genre: 'hip-hop',
    experience: 'intermediate'
  });

  const [suggestions, setSuggestions] = useState<BloomSuggestion[]>([]);
  const [isActive, setIsActive] = useState(false);

  // Generate contextual suggestions based on role and mood
  const generateSuggestions = (ctx: BloomContext): BloomSuggestion[] => {
    const baseSuggestions: BloomSuggestion[] = [];

    if (ctx.role === 'artist') {
      if (ctx.mood === 'creative') {
        baseSuggestions.push(
          {
            id: 'artist-creative-1',
            title: 'Flow Experimentation',
            description: 'Try different rhythmic patterns and flows',
            action: 'Use the Flow Canvas to experiment with new patterns',
            priority: 'high',
            category: 'creative',
            icon: '🎵'
          },
          {
            id: 'artist-creative-2',
            title: 'Vocal Layering',
            description: 'Add harmonies and ad-libs to enhance your vocals',
            action: 'Record multiple takes and layer them for depth',
            priority: 'medium',
            category: 'creative',
            icon: '🎤'
          }
        );
      } else if (ctx.mood === 'technical') {
        baseSuggestions.push(
          {
            id: 'artist-technical-1',
            title: 'Vocal Tuning',
            description: 'Fine-tune your vocal performance',
            action: 'Use the AI assistant to analyze and improve pitch',
            priority: 'high',
            category: 'technical',
            icon: '🎛️'
          }
        );
      }
    } else if (ctx.role === 'engineer') {
      if (ctx.mood === 'analytical') {
        baseSuggestions.push(
          {
            id: 'engineer-analytical-1',
            title: 'Frequency Analysis',
            description: 'Analyze frequency content and identify issues',
            action: 'Use the ALS system to get detailed frequency analysis',
            priority: 'high',
            category: 'technical',
            icon: '📊'
          },
          {
            id: 'engineer-analytical-2',
            title: 'Dynamic Range Optimization',
            description: 'Optimize the dynamic range for better impact',
            action: 'Apply compression and limiting with AI assistance',
            priority: 'medium',
            category: 'technical',
            icon: '⚡'
          }
        );
      }
    } else if (ctx.role === 'producer') {
      baseSuggestions.push(
        {
          id: 'producer-1',
          title: 'Arrangement Review',
          description: 'Review the overall arrangement and structure',
          action: 'Use the timeline to analyze song structure',
          priority: 'high',
          category: 'workflow',
          icon: '📈'
        },
        {
          id: 'producer-2',
          title: 'Genre Adaptation',
          description: `Adapt the mix for ${ctx.genre} standards`,
          action: 'Use AI to analyze and adjust for genre conventions',
          priority: 'medium',
          category: 'technical',
          icon: '🎯'
        }
      );
    }

    return baseSuggestions;
  };

  useEffect(() => {
    if (isActive) {
      const newSuggestions = generateSuggestions(context);
      setSuggestions(newSuggestions);
    }
  }, [context, isActive]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'artist': return 'text-purple-500 bg-purple-900';
      case 'engineer': return 'text-blue-500 bg-blue-900';
      case 'producer': return 'text-green-500 bg-green-900';
      default: return 'text-gray-500 bg-gray-900';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'creative': return 'text-pink-500 bg-pink-900';
      case 'technical': return 'text-cyan-500 bg-cyan-900';
      case 'analytical': return 'text-orange-500 bg-orange-900';
      default: return 'text-gray-500 bg-gray-900';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-900';
      case 'medium': return 'text-yellow-500 bg-yellow-900';
      case 'low': return 'text-green-500 bg-green-900';
      default: return 'text-gray-500 bg-gray-900';
    }
  };

  return (
    <div className="bloom-menu glass-panel p-6 bloom-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Bloom Menu</h3>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-6 py-3 rounded-lg font-bold flow-interactive ${
            isActive 
              ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
              : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
          } text-white shadow-lg transition-all duration-300`}
        >
          {isActive ? '⏸️ Pause Bloom' : '✨ Start Bloom'}
        </button>
      </div>

      {/* Context Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
          <select
            value={context.role}
            onChange={(e) => setContext({ ...context, role: e.target.value as 'artist' | 'engineer' | 'producer' })}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="artist">Artist</option>
            <option value="engineer">Engineer</option>
            <option value="producer">Producer</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Mood</label>
          <select
            value={context.mood}
            onChange={(e) => setContext({ ...context, mood: e.target.value as 'creative' | 'technical' | 'analytical' })}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="creative">Creative</option>
            <option value="technical">Technical</option>
            <option value="analytical">Analytical</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Focus</label>
          <select
            value={context.focus}
            onChange={(e) => setContext({ ...context, focus: e.target.value as 'writing' | 'recording' | 'mixing' | 'mastering' })}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="writing">Writing</option>
            <option value="recording">Recording</option>
            <option value="mixing">Mixing</option>
            <option value="mastering">Mastering</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
          <select
            value={context.genre}
            onChange={(e) => setContext({ ...context, genre: e.target.value })}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="hip-hop">Hip-Hop</option>
            <option value="trap">Trap</option>
            <option value="drill">Drill</option>
            <option value="r&b">R&B</option>
            <option value="pop">Pop</option>
          </select>
        </div>
      </div>

      {/* Context Display */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-800 rounded">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Role:</span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${getRoleColor(context.role)}`}>
            {context.role.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Mood:</span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${getMoodColor(context.mood)}`}>
            {context.mood.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Focus:</span>
          <span className="px-2 py-1 rounded text-xs font-bold bg-gray-700 text-white">
            {context.focus.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Genre:</span>
          <span className="px-2 py-1 rounded text-xs font-bold bg-gray-700 text-white">
            {context.genre.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Suggestions */}
      {isActive && suggestions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">AI Suggestions</h4>
          <div className="grid gap-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="glass-panel p-4 flow-interactive border-l-4 border-purple-500 hover:border-purple-400 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{suggestion.icon}</span>
                      <h5 className="font-semibold text-white">{suggestion.title}</h5>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-bold bg-gray-700 text-white">
                        {suggestion.category.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-2">{suggestion.description}</p>
                    <p className="text-sm text-purple-400 font-medium">{suggestion.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Suggestions */}
      {isActive && suggestions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🤔</div>
          <h4 className="text-xl font-semibold text-white mb-2">No Suggestions</h4>
          <p className="text-gray-300">Try adjusting your context settings for more suggestions.</p>
        </div>
      )}

      {/* Bloom Status */}
      <div className="mt-6 p-4 bg-gray-800 rounded">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-300">
            Bloom Status: <span className={isActive ? 'text-green-500' : 'text-red-500'}>
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="text-sm text-gray-300">
            Suggestions: <span className="text-white">{suggestions.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloomMenu;
