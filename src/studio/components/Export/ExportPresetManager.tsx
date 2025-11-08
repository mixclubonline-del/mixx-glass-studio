import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Save, Upload, Trash2, Music2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ExportPreset {
  id: string;
  name: string;
  description?: string;
  format: 'wav' | 'mp3' | 'ogg' | 'flac';
  sampleRate: 44100 | 48000 | 96000;
  bitDepth: 16 | 24 | 32;
  enableDithering: boolean;
  enableNormalization: boolean;
  targetLUFS: number;
  isDefault?: boolean;
}

const DEFAULT_PRESETS: ExportPreset[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Optimized for Spotify streaming (-14 LUFS)',
    format: 'wav',
    sampleRate: 44100,
    bitDepth: 16,
    enableDithering: true,
    enableNormalization: true,
    targetLUFS: -14,
    isDefault: true,
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    description: 'Optimized for Apple Music streaming (-16 LUFS)',
    format: 'wav',
    sampleRate: 44100,
    bitDepth: 24,
    enableDithering: true,
    enableNormalization: true,
    targetLUFS: -16,
    isDefault: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Optimized for YouTube uploads (-13 LUFS)',
    format: 'wav',
    sampleRate: 48000,
    bitDepth: 16,
    enableDithering: true,
    enableNormalization: true,
    targetLUFS: -13,
    isDefault: true,
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    description: 'Optimized for SoundCloud (-14 LUFS, MP3)',
    format: 'mp3',
    sampleRate: 44100,
    bitDepth: 16,
    enableDithering: true,
    enableNormalization: true,
    targetLUFS: -14,
    isDefault: true,
  },
  {
    id: 'mastered',
    name: 'Mastered (Hi-Res)',
    description: 'High-resolution mastered audio',
    format: 'flac',
    sampleRate: 96000,
    bitDepth: 24,
    enableDithering: false,
    enableNormalization: false,
    targetLUFS: -14,
    isDefault: true,
  },
  {
    id: 'mixing',
    name: 'Mixing (24-bit)',
    description: 'For further mixing/processing',
    format: 'wav',
    sampleRate: 48000,
    bitDepth: 24,
    enableDithering: false,
    enableNormalization: false,
    targetLUFS: -14,
    isDefault: true,
  },
];

const STORAGE_KEY = 'mixx-club-export-presets';

interface ExportPresetManagerProps {
  currentSettings: Omit<ExportPreset, 'id' | 'name' | 'description' | 'isDefault'>;
  onLoadPreset: (preset: ExportPreset) => void;
}

export const ExportPresetManager: React.FC<ExportPresetManagerProps> = ({
  currentSettings,
  onLoadPreset,
}) => {
  const { toast } = useToast();
  const [presets, setPresets] = useState<ExportPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const customPresets: ExportPreset[] = stored ? JSON.parse(stored) : [];
      setPresets([...DEFAULT_PRESETS, ...customPresets]);
    } catch (error) {
      console.error('Failed to load presets:', error);
      setPresets([...DEFAULT_PRESETS]);
    }
  };

  const savePreset = () => {
    if (!newPresetName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for the preset',
        variant: 'destructive',
      });
      return;
    }

    const newPreset: ExportPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      ...currentSettings,
      isDefault: false,
    };

    try {
      const customPresets = presets.filter((p) => !p.isDefault);
      customPresets.push(newPreset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
      
      setPresets([...DEFAULT_PRESETS, ...customPresets]);
      setSelectedPresetId(newPreset.id);
      setShowSaveDialog(false);
      setNewPresetName('');
      setNewPresetDescription('');

      toast({
        title: 'Preset saved',
        description: `"${newPreset.name}" has been saved successfully`,
      });
    } catch (error) {
      console.error('Failed to save preset:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save the preset',
        variant: 'destructive',
      });
    }
  };

  const deletePreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset || preset.isDefault) return;

    try {
      const customPresets = presets.filter((p) => !p.isDefault && p.id !== presetId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
      
      setPresets([...DEFAULT_PRESETS, ...customPresets]);
      if (selectedPresetId === presetId) {
        setSelectedPresetId('');
      }

      toast({
        title: 'Preset deleted',
        description: `"${preset.name}" has been removed`,
      });
    } catch (error) {
      console.error('Failed to delete preset:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the preset',
        variant: 'destructive',
      });
    }
  };

  const handleLoadPreset = () => {
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (preset) {
      onLoadPreset(preset);
      toast({
        title: 'Preset loaded',
        description: `"${preset.name}" settings applied`,
      });
    }
  };

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Export Presets</Label>
        <div className="flex gap-2">
          <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a preset..." />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Platform Presets
              </div>
              {DEFAULT_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center gap-2">
                    <Music2 className="h-3 w-3" />
                    <span>{preset.name}</span>
                  </div>
                </SelectItem>
              ))}
              {presets.filter((p) => !p.isDefault).length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                    Custom Presets
                  </div>
                  {presets
                    .filter((p) => !p.isDefault)
                    .map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                </>
              )}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLoadPreset}
            disabled={!selectedPresetId}
            title="Load preset"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSaveDialog(true)}
            title="Save current settings as preset"
          >
            <Save className="h-4 w-4" />
          </Button>
          {selectedPreset && !selectedPreset.isDefault && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => deletePreset(selectedPresetId)}
              title="Delete preset"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {selectedPreset && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
          <div className="text-sm font-medium">{selectedPreset.name}</div>
          {selectedPreset.description && (
            <div className="text-xs text-muted-foreground">{selectedPreset.description}</div>
          )}
          <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
            <div>Format: {selectedPreset.format.toUpperCase()}</div>
            <div>Sample Rate: {(selectedPreset.sampleRate / 1000).toFixed(1)}kHz</div>
            <div>Bit Depth: {selectedPreset.bitDepth}-bit</div>
            {selectedPreset.enableNormalization && (
              <div>Target: {selectedPreset.targetLUFS} LUFS</div>
            )}
          </div>
        </div>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Export Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g., My Custom Master"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-description">Description (Optional)</Label>
              <Input
                id="preset-description"
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
                placeholder="e.g., For my SoundCloud uploads"
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-xs">
              <div className="font-medium mb-2">Current Settings:</div>
              <div>Format: {currentSettings.format.toUpperCase()}</div>
              <div>Sample Rate: {(currentSettings.sampleRate / 1000).toFixed(1)}kHz</div>
              <div>Bit Depth: {currentSettings.bitDepth}-bit</div>
              <div>Dithering: {currentSettings.enableDithering ? 'Enabled' : 'Disabled'}</div>
              <div>Normalization: {currentSettings.enableNormalization ? 'Enabled' : 'Disabled'}</div>
              {currentSettings.enableNormalization && (
                <div>Target: {currentSettings.targetLUFS} LUFS</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={savePreset}>
              <Save className="mr-2 h-4 w-4" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
