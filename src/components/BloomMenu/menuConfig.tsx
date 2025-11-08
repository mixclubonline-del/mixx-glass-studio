/**
 * Bloom Menu Configuration for Mixx Club Pro
 */

import { MenuConfig } from './types';
import {
  Upload,
  Grid3x3,
  Mic,
  Music,
  Wand2,
  Settings,
  Sliders,
  Volume2,
  Save,
  FolderOpen,
  Play,
  Pause,
  StopCircle,
  Layout,
  Edit3,
  Sparkles,
  Disc3,
  FileAudio,
  Scissors,
  Copy,
  Repeat,
  SplitSquareVertical,
} from 'lucide-react';

export const createMenuConfig = (actions: {
  onImport: () => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
  onTogglePluginBrowser: () => void;
  onToggleAIAssistant: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRecord: () => void;
  onSwitchView: (view: 'arrange' | 'mix' | 'edit' | 'producer-lab' | 'ai-studio') => void;
}): MenuConfig => ({
  main: {
    items: [
      {
        name: 'File',
        subMenu: 'file',
        icon: <FolderOpen size={20} />,
        description: 'Project and file operations'
      },
      {
        name: 'Transport',
        subMenu: 'transport',
        icon: <Play size={20} />,
        description: 'Playback controls'
      },
      {
        name: 'View',
        subMenu: 'view',
        icon: <Layout size={20} />,
        description: 'Switch between views'
      },
      {
        name: 'Tools',
        subMenu: 'tools',
        icon: <Wand2 size={20} />,
        description: 'Creative tools and effects'
      },
      {
        name: 'AI',
        subMenu: 'ai',
        icon: <Sparkles size={20} />,
        description: 'AI-powered features'
      },
      {
        name: 'Settings',
        icon: <Settings size={20} />,
        action: () => console.log('Settings'),
        description: 'Preferences and settings'
      }
    ]
  },
  file: {
    parent: 'main',
    items: [
      {
        name: 'Import Audio',
        icon: <Upload size={18} />,
        action: actions.onImport,
        description: 'Import audio files'
      },
      {
        name: 'Export Mix',
        icon: <Save size={18} />,
        action: actions.onExport,
        description: 'Export your project'
      },
      {
        name: 'Save Project',
        icon: <Save size={18} />,
        action: actions.onSave,
        description: 'Save current project'
      },
      {
        name: 'Load Project',
        icon: <FolderOpen size={18} />,
        action: actions.onLoad,
        description: 'Load existing project'
      }
    ]
  },
  transport: {
    parent: 'main',
    items: [
      {
        name: 'Play',
        icon: <Play size={18} />,
        action: actions.onPlay,
        description: 'Start playback (Space)'
      },
      {
        name: 'Pause',
        icon: <Pause size={18} />,
        action: actions.onPause,
        description: 'Pause playback (Space)'
      },
      {
        name: 'Stop',
        icon: <StopCircle size={18} />,
        action: actions.onStop,
        description: 'Stop and return to start'
      },
      {
        name: 'Record',
        icon: <Mic size={18} />,
        action: actions.onRecord,
        description: 'Start recording (Shift+Space)'
      },
      {
        name: 'Loop',
        icon: <Repeat size={18} />,
        action: () => console.log('Toggle loop'),
        description: 'Toggle loop mode (L)'
      }
    ]
  },
  view: {
    parent: 'main',
    items: [
      {
        name: 'Arrange',
        icon: <Layout size={18} />,
        action: () => actions.onSwitchView('arrange'),
        description: 'Arrangement view'
      },
      {
        name: 'Mix',
        icon: <Sliders size={18} />,
        action: () => actions.onSwitchView('mix'),
        description: 'Mixer view'
      },
      {
        name: 'Edit',
        icon: <Edit3 size={18} />,
        action: () => actions.onSwitchView('edit'),
        description: 'Waveform editor'
      },
      {
        name: 'Producer Lab',
        icon: <Disc3 size={18} />,
        action: () => actions.onSwitchView('producer-lab'),
        description: 'Instruments and samples'
      },
      {
        name: 'AI Studio',
        icon: <Sparkles size={18} />,
        action: () => actions.onSwitchView('ai-studio'),
        description: 'AI creative tools'
      }
    ]
  },
  tools: {
    parent: 'main',
    items: [
      {
        name: 'Plugins',
        icon: <Grid3x3 size={18} />,
        action: actions.onTogglePluginBrowser,
        description: 'Open plugin suite'
      },
      {
        name: 'Split',
        icon: <Scissors size={18} />,
        action: () => console.log('Split region'),
        description: 'Split audio region'
      },
      {
        name: 'Duplicate',
        icon: <Copy size={18} />,
        action: () => console.log('Duplicate'),
        description: 'Duplicate selection'
      },
      {
        name: 'Range',
        icon: <SplitSquareVertical size={18} />,
        action: () => console.log('Range selection'),
        description: 'Select range'
      }
    ]
  },
  ai: {
    parent: 'main',
    items: [
      {
        name: 'AI Assistant',
        icon: <Sparkles size={18} />,
        action: actions.onToggleAIAssistant,
        description: 'Open AI mixing assistant'
      },
      {
        name: 'Auto Mix',
        icon: <Wand2 size={18} />,
        action: () => console.log('Auto mix'),
        description: 'AI-powered auto mixing'
      },
      {
        name: 'Master',
        icon: <Volume2 size={18} />,
        action: () => console.log('AI master'),
        description: 'AI mastering'
      },
      {
        name: 'Generate',
        icon: <Music size={18} />,
        action: () => console.log('Generate audio'),
        description: 'AI audio generation'
      }
    ]
  }
});
