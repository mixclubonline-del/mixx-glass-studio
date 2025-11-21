/**
 * Audio Device Selector Component
 * 
 * Allows users to select audio input and output devices.
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

import React, { useState, useEffect } from 'react';
import { getInputDevices, getOutputDevices, type AudioDevice } from '../utils/audioDeviceManager';

interface AudioDeviceSelectorProps {
  onInputDeviceChange?: (deviceId: string) => void;
  onOutputDeviceChange?: (deviceId: string) => void;
  className?: string;
}

export const AudioDeviceSelector: React.FC<AudioDeviceSelectorProps> = ({
  onInputDeviceChange,
  onOutputDeviceChange,
  className = '',
}) => {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('default');
  const [selectedOutput, setSelectedOutput] = useState<string>('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [inputs, outputs] = await Promise.all([
          getInputDevices(),
          getOutputDevices(),
        ]);
        
        setInputDevices(inputs);
        setOutputDevices(outputs);
        
        // Set default to first device if available
        if (inputs.length > 0 && selectedInput === 'default') {
          setSelectedInput(inputs[0].deviceId);
        }
        if (outputs.length > 0 && selectedOutput === 'default') {
          setSelectedOutput(outputs[0].deviceId);
        }
      } catch (err) {
        console.error('[AUDIO DEVICES] Failed to load devices:', err);
        setError('Failed to load audio devices. Please check browser permissions.');
      } finally {
        setLoading(false);
      }
    };

    // Load devices on mount
    loadDevices();
    
    // Listen for device changes instead of polling
    // This prevents aggressive device enumeration that causes switching
    const handleDeviceChange = () => {
      console.log('[AUDIO DEVICES] Device change detected, refreshing list...');
      loadDevices();
    };
    
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
    
    // Fallback: Only poll if devicechange event is not supported (very rare)
    // Use a much longer interval (30 seconds) to avoid device switching
    const interval = setInterval(loadDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (deviceId: string) => {
    setSelectedInput(deviceId);
    onInputDeviceChange?.(deviceId);
  };

  const handleOutputChange = (deviceId: string) => {
    setSelectedOutput(deviceId);
    onOutputDeviceChange?.(deviceId);
    // Note: Web Audio API doesn't support output device selection directly
    // This would require setSinkId (experimental) or browser-specific APIs
    console.warn('[AUDIO DEVICES] Output device selection is not fully supported in Web Audio API');
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-ink/60 ${className}`}>
        <span>Loading audio devices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-400 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-ink/70">
          Input Device
        </label>
        <select
          value={selectedInput}
          onChange={(e) => handleInputChange(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
        >
          {inputDevices.length === 0 ? (
            <option value="default">No input devices available</option>
          ) : (
            inputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-ink/70">
          Output Device
        </label>
        <select
          value={selectedOutput}
          onChange={(e) => handleOutputChange(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
          disabled={outputDevices.length === 0}
        >
          {outputDevices.length === 0 ? (
            <option value="default">No output devices available</option>
          ) : (
            outputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))
          )}
        </select>
        {outputDevices.length > 0 && (
          <p className="text-[10px] text-ink/50">
            Note: Output device selection may require browser-specific settings
          </p>
        )}
      </div>
    </div>
  );
};

export default AudioDeviceSelector;

