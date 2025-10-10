/**
 * Vocal Intelligence Zone
 * Record/upload vocals, AI voice blending, tone sculpting
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IceFireKnob } from '../Controls/IceFireKnob';
import { Mic, Upload, Play, Square, AudioWaveform } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VocalIntelligenceZoneProps {
  onVocalData: (data: { audioBlob?: Blob; waveform?: number[] }) => void;
  isGenerating: boolean;
}

export const VocalIntelligenceZone: React.FC<VocalIntelligenceZoneProps> = ({
  onVocalData,
  isGenerating
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [toneSculpt, setToneSculpt] = useState(50);
  const [emotion, setEmotion] = useState(50);
  const [aiBlend, setAiBlend] = useState(30);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const waveform = Array.from({ length: 100 }, () => Math.random());
        onVocalData({ audioBlob: blob, waveform });
        setHasRecording(true);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak into your microphone"
      });
    } catch (err) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record vocals",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const waveform = Array.from({ length: 100 }, () => Math.random());
      onVocalData({ waveform });
      setHasRecording(true);
      toast({
        title: "Vocal uploaded",
        description: file.name
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-blue-500/20 flex items-center justify-center">
          <Mic size={20} className="text-pink-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Vocal Intelligence Zone</h3>
          <p className="text-xs text-muted-foreground">Record • Upload • Blend with AI voice model</p>
        </div>
      </div>

      {/* Record/Upload Controls */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isGenerating}
          variant={isRecording ? "destructive" : "outline"}
          className="h-12 rounded-xl"
        >
          {isRecording ? (
            <>
              <Square size={16} className="mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic size={16} className="mr-2" />
              Record Vocals
            </>
          )}
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating || isRecording}
          variant="outline"
          className="h-12 rounded-xl"
        >
          <Upload size={16} className="mr-2" />
          Upload Audio
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Waveform Visualization */}
      {hasRecording && (
        <div className="glass rounded-xl p-4 border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <AudioWaveform size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Reactive Waveform</span>
          </div>
          <div className="h-24 bg-background/50 rounded-lg flex items-center justify-center gap-1 p-2">
            {Array.from({ length: 50 }, (_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-purple-500 via-pink-500 to-blue-500 rounded-full opacity-60 animate-pulse"
                style={{
                  height: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Processing Controls */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center space-y-2">
          <Label className="text-xs font-medium">AI Voice Blend</Label>
          <IceFireKnob
            value={aiBlend}
            onChange={setAiBlend}
            size={64}
            label={`${aiBlend}%`}
          />
        </div>

        <div className="flex flex-col items-center space-y-2">
          <Label className="text-xs font-medium">Tone Sculpt</Label>
          <IceFireKnob
            value={toneSculpt}
            onChange={setToneSculpt}
            size={64}
            label={`${toneSculpt}%`}
          />
        </div>

        <div className="flex flex-col items-center space-y-2">
          <Label className="text-xs font-medium">Emotion</Label>
          <IceFireKnob
            value={emotion}
            onChange={setEmotion}
            size={64}
            label={`${emotion}%`}
          />
        </div>
      </div>
    </div>
  );
};
