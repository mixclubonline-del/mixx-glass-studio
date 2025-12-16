// components/AIHub/AIMasteringAssistant.tsx
import React, { useState, useRef, useCallback } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import RadioButton from '../common/RadioButton';
import { DownloadIcon, SlidersIcon } from '../icons'; // Using SlidersIcon for visual identity
import { VelvetProcessor, VelvetProcessorOptions } from '../../audio/VelvetProcessor';
import { MASTERING_PROFILES, MasteringProfile } from '../../types/sonic-architecture';
import { ensureMasterCompliance } from '../../audio/VelvetValidator';
import { als } from '../../utils/alsFeedback';

interface AIMasteringAssistantProps {
  audioContext: AudioContext | null;
}

type MasteringProfileKey = 'streaming' | 'club' | 'custom';

const AIMasteringAssistant: React.FC<AIMasteringAssistantProps> = ({ audioContext }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [masteredBlob, setMasteredBlob] = useState<Blob | null>(null);
  const [selectedProfileKey, setSelectedProfileKey] = useState<MasteringProfileKey>('streaming');
  const [customLufsTarget, setCustomLufsTarget] = useState<number>(-14);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && audioContext) {
      setAudioFile(file);
      setMasteredBlob(null);
      setError(null);
      setProcessingMessage('Decoding audio...');
      setIsProcessing(true);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioBuffer(decodedBuffer);
      } catch (err: any) {
        als.error("Error decoding audio file", err);
        setError(`Failed to decode audio: ${err.message || 'Unknown error'}`);
        setAudioBuffer(null);
      } finally {
        setIsProcessing(false);
        setProcessingMessage('');
        if (e.target) e.target.value = ''; // Clear file input
      }
    }
  }, [audioContext]);

  const handleMasterAudio = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioBuffer || !audioContext) {
      setError("Please upload an audio file first.");
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Applying AI Mastering...');
    setError(null);
    setMasteredBlob(null);

    try {
      const velvetProcessor = new VelvetProcessor(audioContext);
      let profile: MasteringProfile;
      let targetLufs = customLufsTarget;

      if (selectedProfileKey === 'streaming') {
        profile = MASTERING_PROFILES.streaming;
        targetLufs = profile.targetLUFS;
      } else if (selectedProfileKey === 'club') {
        profile = MASTERING_PROFILES.club;
        targetLufs = profile.targetLUFS;
      } else { // Custom profile
        // Create a generic custom profile based on default streaming values
        profile = {
          ...MASTERING_PROFILES.streaming,
          name: 'Custom Mastering',
          targetLUFS: customLufsTarget,
        };
      }

      const options: VelvetProcessorOptions = {
        profile: profile,
        targetLUFS: targetLufs,
        applyLimiter: true, // Always apply a safety limiter in mastering
      };

      const processedBuffer = await velvetProcessor.processAudioBuffer(audioBuffer, options);
      const validation = ensureMasterCompliance(processedBuffer, profile);
      setProcessingMessage(
        `Compliance ready • Target met`
      );
      const blob = velvetProcessor.exportWAV(processedBuffer);
      setMasteredBlob(blob);
    } catch (err: any) {
      als.error("Error during AI mastering", err);
      if (Array.isArray(err?.issues) && err.issues.length) {
        setError(`Mastering failed: ${err.issues.join(' • ')}`);
      } else {
        setError(`Mastering failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [audioBuffer, audioContext, selectedProfileKey, customLufsTarget]);

  const downloadMasteredAudio = useCallback(() => {
    if (masteredBlob && audioFile) {
      const url = URL.createObjectURL(masteredBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mastered-${audioFile.name.replace(/\.[^/.]+$/, "")}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [masteredBlob, audioFile]);

  return (
    <div className="flex flex-col h-full bg-gray-900/60 rounded-lg p-4 shadow-inner">
      <h3 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">AI Mastering Assistant</h3>

      <div className="flex-shrink-0 mb-4 space-y-4">
        {/* Audio Upload */}
        <div>
          <label htmlFor="audioUpload" className="block text-sm font-medium text-gray-300 mb-1">
            Upload Audio (WAV/MP3):
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/wav, audio/mpeg"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isProcessing}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            <SlidersIcon className="w-5 h-5" /> {/* Using SlidersIcon for "Mastering" */}
            <span>{audioFile ? `Change File: ${audioFile.name}` : 'Select Audio File'}</span>
          </button>
          {audioFile && <p className="text-gray-400 text-sm mt-2 text-center">{audioFile.name}</p>}
        </div>

        {/* Mastering Profile Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mastering Profile:
          </label>
          <div className="flex flex-wrap gap-4">
            <RadioButton
              label="Streaming Standard"
              value="streaming"
              checked={selectedProfileKey === 'streaming'}
              onChange={(val) => setSelectedProfileKey(val as MasteringProfileKey)}
              name="masteringProfile"
              color="fuchsia"
              disabled={isProcessing}
            />
            <RadioButton
              label="Club Mix"
              value="club"
              checked={selectedProfileKey === 'club'}
              onChange={(val) => setSelectedProfileKey(val as MasteringProfileKey)}
              name="masteringProfile"
              color="fuchsia"
              disabled={isProcessing}
            />
            <RadioButton
              label="Custom Level"
              value="custom"
              checked={selectedProfileKey === 'custom'}
              onChange={(val) => setSelectedProfileKey(val as MasteringProfileKey)}
              name="masteringProfile"
              color="fuchsia"
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Custom Level Target Slider */}
        {selectedProfileKey === 'custom' && (
          <div>
            <label htmlFor="lufsTarget" className="block text-sm font-medium text-gray-300 mb-1">
              Target Level: {customLufsTarget >= -10 ? 'Club' : customLufsTarget >= -14 ? 'Streaming' : customLufsTarget >= -18 ? 'Broadcast' : 'Cinematic'}
            </label>
            <input
              type="range"
              id="lufsTarget"
              min="-20"
              max="-6"
              step="0.1"
              value={customLufsTarget}
              onChange={(e) => setCustomLufsTarget(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-fuchsia-600/50 accent-fuchsia-500 disabled:opacity-50"
              disabled={isProcessing}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Cinematic</span>
              <span>Club</span>
            </div>
          </div>
        )}

        {/* Process Button */}
        <button
          onClick={handleMasterAudio}
          className="w-full px-6 py-3 bg-fuchsia-600 text-white rounded-lg font-semibold hover:bg-fuchsia-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!audioBuffer || isProcessing}
        >
          {isProcessing ? (
            <LoadingSpinner size="sm" color="white" message={processingMessage} />
          ) : (
            'Start AI Mastering'
          )}
        </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center bg-gray-800/50 rounded-lg p-3 shadow-inner relative">
        {error && (
          <div className="text-red-400 text-center p-4">{error}</div>
        )}
        {masteredBlob && !isProcessing && !error ? (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-green-400 text-lg font-semibold">Mastering Successful!</p>
            <button
              onClick={downloadMasteredAudio}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-500 transition-colors flex items-center space-x-2"
            >
              <DownloadIcon className="w-5 h-5" />
              <span>Download Mastered Audio</span>
            </button>
          </div>
        ) : !audioFile && !isProcessing && !error ? (
          <div className="flex flex-col items-center text-gray-500">
            <SlidersIcon className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-lg text-center">Upload audio and select a profile to begin AI mastering.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AIMasteringAssistant;
