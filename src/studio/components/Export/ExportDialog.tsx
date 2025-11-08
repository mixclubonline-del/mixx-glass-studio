import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, AlertCircle, CheckCircle2, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LUFSCalculator } from '@/audio/metering/LUFSCalculator';
import { useTracksStore } from '@/store/tracksStore';
import { ExportPresetManager, ExportPreset } from './ExportPresetManager';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioEngine: any;
}

type ExportFormat = 'wav' | 'mp3' | 'ogg' | 'flac';
type SampleRate = 44100 | 48000 | 96000;
type BitDepth = 16 | 24 | 32;
type ExportMode = 'master' | 'stems' | 'groups';

interface StemSelection {
  trackId: string;
  selected: boolean;
  name: string;
  group?: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onOpenChange, audioEngine }) => {
  const { toast } = useToast();
  const tracks = useTracksStore((state) => state.tracks);
  
  const [exportMode, setExportMode] = useState<ExportMode>('master');
  const [format, setFormat] = useState<ExportFormat>('wav');
  const [sampleRate, setSampleRate] = useState<SampleRate>(48000);
  const [bitDepth, setBitDepth] = useState<BitDepth>(24);
  const [enableDithering, setEnableDithering] = useState(true);
  const [enableNormalization, setEnableNormalization] = useState(true);
  const [targetLUFS, setTargetLUFS] = useState(-14);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLUFS, setCurrentLUFS] = useState<number | null>(null);
  const [currentStem, setCurrentStem] = useState<string>('');
  
  // Stem selection state
  const [stemSelections, setStemSelections] = useState<StemSelection[]>([]);
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'color'>('none');

  useEffect(() => {
    if (open && audioEngine) {
      analyzeCurrentLUFS();
      initializeStemSelections();
    }
  }, [open, tracks]);

  const initializeStemSelections = () => {
    const selections: StemSelection[] = tracks.map((track) => ({
      trackId: track.id,
      selected: true,
      name: track.name,
      group: track.color,
    }));
    setStemSelections(selections);
  };

  const toggleStemSelection = (trackId: string) => {
    setStemSelections((prev) =>
      prev.map((stem) =>
        stem.trackId === trackId ? { ...stem, selected: !stem.selected } : stem
      )
    );
  };

  const toggleAllStems = (selected: boolean) => {
    setStemSelections((prev) => prev.map((stem) => ({ ...stem, selected })));
  };

  const getSelectedStems = () => stemSelections.filter((s) => s.selected);

  const getGroupedStems = () => {
    if (groupBy === 'none') {
      return { ungrouped: stemSelections };
    }
    
    const grouped: Record<string, StemSelection[]> = {};
    stemSelections.forEach((stem) => {
      const key = groupBy === 'type' ? 'Audio' : stem.group || 'Default';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(stem);
    });
    return grouped;
  };

  const analyzeCurrentLUFS = async () => {
    try {
      const audioContext = audioEngine.audioContext;
      const lufsCalc = new LUFSCalculator(audioContext);
      
      // Get current mix buffer
      const blob = await audioEngine.exportMix();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Calculate LUFS
      const samples = audioBuffer.getChannelData(0);
      const integrated = lufsCalc.calculateIntegrated(samples, audioBuffer.numberOfChannels);
      setCurrentLUFS(integrated);
    } catch (error) {
      console.error('Error analyzing LUFS:', error);
    }
  };

  const handleExport = async () => {
    if (!audioEngine) {
      toast({
        title: 'Error',
        description: 'Audio engine not available',
        variant: 'destructive',
      });
      return;
    }

    setExporting(true);
    setProgress(0);

    try {
      if (exportMode === 'master') {
        await exportMasterMix();
      } else if (exportMode === 'stems') {
        await exportStems();
      } else if (exportMode === 'groups') {
        await exportGroups();
      }

      toast({
        title: 'Export Complete',
        description: `Successfully exported to ${format.toUpperCase()}`,
      });

      setTimeout(() => {
        onOpenChange(false);
        setExporting(false);
        setProgress(0);
      }, 500);

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      setExporting(false);
      setProgress(0);
    }
  };

  const exportMasterMix = async () => {
    setCurrentStem('Master Mix');
    setProgress(20);
    const blob = await audioEngine.exportMix();
      
      // Step 2: Decode audio (40%)
      setProgress(40);
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Step 3: Apply normalization if enabled (60%)
      setProgress(60);
      let processedBuffer = audioBuffer;
      
      if (enableNormalization) {
        processedBuffer = await normalizeToLUFS(audioBuffer, targetLUFS);
      }

      // Step 4: Apply dithering if enabled and bit depth < 32 (75%)
      setProgress(75);
      if (enableDithering && bitDepth < 32) {
        processedBuffer = applyDithering(processedBuffer, bitDepth);
      }

      // Step 5: Convert to target format (90%)
      setProgress(90);
      const exportedBlob = await convertToFormat(processedBuffer, format, sampleRate, bitDepth);

    // Step 6: Download (100%)
    setProgress(100);
    downloadBlob(exportedBlob, `master.${format}`);
  };

  const exportStems = async () => {
    const selectedStems = getSelectedStems();
    if (selectedStems.length === 0) {
      throw new Error('No stems selected for export');
    }

    const totalStems = selectedStems.length;
    
    for (let i = 0; i < totalStems; i++) {
      const stem = selectedStems[i];
      setCurrentStem(stem.name);
      
      const stemProgress = (i / totalStems) * 100;
      setProgress(stemProgress);

      // Solo this track
      audioEngine.tracks.forEach((track: any) => {
        if (track.id === stem.trackId) {
          track.setSolo(true);
        } else {
          track.setSolo(false);
        }
      });

      // Export solo'd track
      const blob = await audioEngine.exportMix();
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Process
      let processedBuffer = audioBuffer;
      if (enableNormalization) {
        processedBuffer = await normalizeToLUFS(processedBuffer, targetLUFS);
      }
      if (enableDithering && bitDepth < 32) {
        processedBuffer = applyDithering(processedBuffer, bitDepth);
      }

      const exportedBlob = await convertToFormat(processedBuffer, format, sampleRate, bitDepth);
      downloadBlob(exportedBlob, `${sanitizeFilename(stem.name)}.${format}`);

      // Unsolo all
      audioEngine.tracks.forEach((track: any) => track.setSolo(false));
    }
    
    setProgress(100);
  };

  const exportGroups = async () => {
    const grouped = getGroupedStems();
    const groupNames = Object.keys(grouped).filter(key => key !== 'ungrouped');
    
    if (groupNames.length === 0) {
      throw new Error('No groups available for export');
    }

    const totalGroups = groupNames.length;
    
    for (let i = 0; i < totalGroups; i++) {
      const groupName = groupNames[i];
      const groupStems = grouped[groupName].filter(s => s.selected);
      
      if (groupStems.length === 0) continue;
      
      setCurrentStem(`${groupName} Group`);
      const groupProgress = (i / totalGroups) * 100;
      setProgress(groupProgress);

      // Solo tracks in this group
      audioEngine.tracks.forEach((track: any) => {
        const isInGroup = groupStems.some(stem => stem.trackId === track.id);
        track.setSolo(isInGroup);
      });

      // Export group
      const blob = await audioEngine.exportMix();
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Process
      let processedBuffer = audioBuffer;
      if (enableNormalization) {
        processedBuffer = await normalizeToLUFS(processedBuffer, targetLUFS);
      }
      if (enableDithering && bitDepth < 32) {
        processedBuffer = applyDithering(processedBuffer, bitDepth);
      }

      const exportedBlob = await convertToFormat(processedBuffer, format, sampleRate, bitDepth);
      downloadBlob(exportedBlob, `${sanitizeFilename(groupName)}_group.${format}`);

      // Unsolo all
      audioEngine.tracks.forEach((track: any) => track.setSolo(false));
    }
    
    setProgress(100);
  };

  const sanitizeFilename = (name: string): string => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  };

  const normalizeToLUFS = async (buffer: AudioBuffer, targetLUFS: number): Promise<AudioBuffer> => {
    const audioContext = new AudioContext({ sampleRate: buffer.sampleRate });
    const lufsCalc = new LUFSCalculator(audioContext);
    
    // Calculate current LUFS
    const samples = buffer.getChannelData(0);
    const currentLUFS = lufsCalc.calculateIntegrated(samples, buffer.numberOfChannels);
    
    // Calculate gain needed
    const gainDB = targetLUFS - currentLUFS;
    const gain = Math.pow(10, gainDB / 20);
    
    // Apply gain
    const normalizedBuffer = audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = normalizedBuffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        outputData[i] = Math.max(-1, Math.min(1, inputData[i] * gain));
      }
    }
    
    return normalizedBuffer;
  };

  const applyDithering = (buffer: AudioBuffer, targetBitDepth: number): AudioBuffer => {
    const audioContext = new AudioContext({ sampleRate: buffer.sampleRate });
    const ditheredBuffer = audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    const ditherAmount = 1 / Math.pow(2, targetBitDepth);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = ditheredBuffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        // TPDF dithering
        const dither = (Math.random() + Math.random() - 1) * ditherAmount;
        outputData[i] = inputData[i] + dither;
      }
    }
    
    return ditheredBuffer;
  };

  const convertToFormat = async (
    buffer: AudioBuffer,
    format: ExportFormat,
    sampleRate: number,
    bitDepth: number
  ): Promise<Blob> => {
    // For now, we'll encode to WAV and let the browser handle it
    // In production, you'd use proper encoders for each format
    const wav = encodeWAV(buffer, bitDepth);
    
    return new Blob([wav], { 
      type: format === 'wav' ? 'audio/wav' : `audio/${format}` 
    });
  };

  const encodeWAV = (buffer: AudioBuffer, bitDepth: number): ArrayBuffer => {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length * numChannels * (bitDepth / 8);
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Collect channel data
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    // Write WAV header
    const writeString = (str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(pos++, str.charCodeAt(i));
      }
    };

    writeString('RIFF');
    view.setUint32(pos, 36 + length, true); pos += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(pos, 16, true); pos += 4; // PCM
    view.setUint16(pos, 1, true); pos += 2; // Format
    view.setUint16(pos, numChannels, true); pos += 2;
    view.setUint32(pos, buffer.sampleRate, true); pos += 4;
    view.setUint32(pos, buffer.sampleRate * numChannels * (bitDepth / 8), true); pos += 4;
    view.setUint16(pos, numChannels * (bitDepth / 8), true); pos += 2;
    view.setUint16(pos, bitDepth, true); pos += 2;
    writeString('data');
    view.setUint32(pos, length, true); pos += 4;

    // Write interleaved samples
    const maxValue = Math.pow(2, bitDepth - 1) - 1;
    
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        
        if (bitDepth === 16) {
          view.setInt16(pos, sample * maxValue, true);
          pos += 2;
        } else if (bitDepth === 24) {
          const val = Math.floor(sample * maxValue);
          view.setUint8(pos++, val & 0xff);
          view.setUint8(pos++, (val >> 8) & 0xff);
          view.setUint8(pos++, (val >> 16) & 0xff);
        } else if (bitDepth === 32) {
          view.setFloat32(pos, sample, true);
          pos += 4;
        }
      }
    }

    return arrayBuffer;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadPreset = (preset: ExportPreset) => {
    setFormat(preset.format);
    setSampleRate(preset.sampleRate);
    setBitDepth(preset.bitDepth);
    setEnableDithering(preset.enableDithering);
    setEnableNormalization(preset.enableNormalization);
    setTargetLUFS(preset.targetLUFS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-background/95 backdrop-blur border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Download className="w-6 h-6 text-primary" />
            Professional Export
          </DialogTitle>
          <DialogDescription>
            Export master mix, individual stems, or track groups
          </DialogDescription>
        </DialogHeader>

        <Tabs value={exportMode} onValueChange={(v) => setExportMode(v as ExportMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="master">Master Mix</TabsTrigger>
            <TabsTrigger value="stems" className="gap-1">
              <Layers className="w-3 h-3" />
              Stems
            </TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="master" className="space-y-6 py-4">
          {/* Preset Manager */}
          <ExportPresetManager
            currentSettings={{
              format,
              sampleRate,
              bitDepth,
              enableDithering,
              enableNormalization,
              targetLUFS,
            }}
            onLoadPreset={handleLoadPreset}
          />

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wav">WAV - Uncompressed</SelectItem>
                <SelectItem value="mp3">MP3 - Compressed</SelectItem>
                <SelectItem value="ogg">OGG - Open Source</SelectItem>
                <SelectItem value="flac">FLAC - Lossless</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sample Rate & Bit Depth */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sample Rate</Label>
              <Select value={sampleRate.toString()} onValueChange={(v) => setSampleRate(parseInt(v) as SampleRate)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="44100">44.1 kHz - CD Quality</SelectItem>
                  <SelectItem value="48000">48 kHz - Professional</SelectItem>
                  <SelectItem value="96000">96 kHz - High Res</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bit Depth</Label>
              <Select value={bitDepth.toString()} onValueChange={(v) => setBitDepth(parseInt(v) as BitDepth)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16-bit - Standard</SelectItem>
                  <SelectItem value="24">24-bit - Professional</SelectItem>
                  <SelectItem value="32">32-bit Float - Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dithering */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
            <div className="space-y-0.5">
              <Label>Dithering</Label>
              <p className="text-sm text-muted-foreground">
                Add noise shaping to reduce quantization artifacts
              </p>
            </div>
            <Switch 
              checked={enableDithering} 
              onCheckedChange={setEnableDithering}
              disabled={bitDepth === 32}
            />
          </div>

          {/* LUFS Normalization */}
          <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>LUFS Normalization</Label>
                <p className="text-sm text-muted-foreground">
                  Normalize to broadcast standards
                </p>
              </div>
              <Switch 
                checked={enableNormalization} 
                onCheckedChange={setEnableNormalization}
              />
            </div>

            {enableNormalization && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Level:</span>
                  <span className={currentLUFS !== null ? 'font-mono font-medium' : ''}>
                    {currentLUFS !== null ? `${currentLUFS.toFixed(1)} LUFS` : 'Analyzing...'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Target LUFS</Label>
                    <Input 
                      type="number" 
                      value={targetLUFS} 
                      onChange={(e) => setTargetLUFS(parseFloat(e.target.value))}
                      className="w-24 text-right"
                      step="0.1"
                    />
                  </div>
                  <Slider 
                    value={[targetLUFS]} 
                    onValueChange={([v]) => setTargetLUFS(v)}
                    min={-23}
                    max={-6}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-23 LUFS (Quiet)</span>
                    <span>-14 LUFS (Streaming)</span>
                    <span>-6 LUFS (Loud)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

            {/* Export Progress */}
            {exporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Exporting...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="stems" className="space-y-6 py-4">
            {/* Stem Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Tracks to Export</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleAllStems(true)}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleAllStems(false)}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[200px] rounded-md border border-border/50 p-4">
                <div className="space-y-2">
                  {stemSelections.map((stem) => (
                    <div
                      key={stem.trackId}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        checked={stem.selected}
                        onCheckedChange={() => toggleStemSelection(stem.trackId)}
                      />
                      <span className="flex-1 text-sm">{stem.name}</span>
                      {stem.group && (
                        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                          {stem.group}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <p className="text-sm text-muted-foreground">
                Selected: {getSelectedStems().length} / {stemSelections.length} tracks
              </p>
            </div>

            {/* Format & Quality Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wav">WAV</SelectItem>
                    <SelectItem value="flac">FLAC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sample Rate</Label>
                <Select value={sampleRate.toString()} onValueChange={(v) => setSampleRate(parseInt(v) as SampleRate)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="48000">48 kHz</SelectItem>
                    <SelectItem value="96000">96 kHz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Progress */}
            {exporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Exporting: {currentStem}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-6 py-4">
            {/* Group By Selection */}
            <div className="space-y-2">
              <Label>Group Tracks By</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="color">Track Color</SelectItem>
                  <SelectItem value="type">Track Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group Preview */}
            {groupBy !== 'none' && (
              <ScrollArea className="h-[200px] rounded-md border border-border/50 p-4">
                <div className="space-y-4">
                  {Object.entries(getGroupedStems()).map(([groupName, groupStems]) => {
                    if (groupName === 'ungrouped') return null;
                    const selectedInGroup = groupStems.filter(s => s.selected).length;
                    return (
                      <div key={groupName} className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="font-medium text-sm">{groupName}</span>
                          <span className="text-xs text-muted-foreground">
                            {selectedInGroup} tracks
                          </span>
                        </div>
                        <div className="pl-4 space-y-1">
                          {groupStems.map((stem) => (
                            <div key={stem.trackId} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={stem.selected}
                                onCheckedChange={() => toggleStemSelection(stem.trackId)}
                              />
                              <span className="text-muted-foreground">{stem.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Format Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wav">WAV</SelectItem>
                    <SelectItem value="flac">FLAC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bit Depth</Label>
                <Select value={bitDepth.toString()} onValueChange={(v) => setBitDepth(parseInt(v) as BitDepth)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24-bit</SelectItem>
                    <SelectItem value="32">32-bit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Progress */}
            {exporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Exporting: {currentStem}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={exporting || (exportMode === 'stems' && getSelectedStems().length === 0)}
            className="gap-2"
          >
            {exporting ? (
              <>Processing...</>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {exportMode === 'master' ? 'Export Mix' : 
                 exportMode === 'stems' ? `Export ${getSelectedStems().length} Stems` :
                 'Export Groups'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
