/**
 * Audio Recording Hook
 * Handles microphone input and recording to tracks
 */

import { useState, useCallback, useRef } from 'react';
import { useTracksStore } from '@/store/tracksStore';
import { toast } from 'sonner';

interface RecordingState {
  isRecording: boolean;
  recordingTrackId: string | null;
  recordingStartTime: number;
}

export function useAudioRecording() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    recordingTrackId: null,
    recordingStartTime: 0
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async (trackId: string, currentTime: number) => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processRecording(audioBlob, trackId, state.recordingStartTime);
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      setState({
        isRecording: true,
        recordingTrackId: trackId,
        recordingStartTime: currentTime
      });

      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  }, [state.recordingStartTime]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      setState({
        isRecording: false,
        recordingTrackId: null,
        recordingStartTime: 0
      });
      toast.success('Recording stopped');
    }
  }, [state.isRecording]);

  const processRecording = async (blob: Blob, trackId: string, startTime: number) => {
    try {
      // Convert blob to audio buffer
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Add region to track
      const { addRegion } = useTracksStore.getState();
      addRegion({
        id: `recording-${Date.now()}`,
        trackId,
        name: 'Recording',
        startTime,
        duration: audioBuffer.duration,
        bufferOffset: 0,
        bufferDuration: audioBuffer.duration,
        audioBuffer,
        color: 'hsl(0, 70%, 50%)', // Red for recordings
        fadeIn: 0,
        fadeOut: 0,
        gain: 1,
        locked: false,
        muted: false
      });

      toast.success('Recording added to timeline');
    } catch (error) {
      console.error('Failed to process recording:', error);
      toast.error('Failed to process recording');
    }
  };

  return {
    ...state,
    startRecording,
    stopRecording
  };
}
