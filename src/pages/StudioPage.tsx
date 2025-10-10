// src/pages/StudioPage.tsx
// Simple studio page with core components
import { useState } from "react";
import { EffectsRack } from "../studio/components/EffectsRack";
import { Timeline } from "../studio/components/Timeline";
import { TransportControls } from "../studio/components/TransportControls";

export default function StudioPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes default
  const [reverbMix, setReverbMix] = useState(0.3);
  const [delayTime, setDelayTime] = useState(0.5);
  const [delayFeedback, setDelayFeedback] = useState(0.4);
  const [delayMix, setDelayMix] = useState(0.3);
  const [limiterThreshold, setLimiterThreshold] = useState(-1);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };
  const handleSeek = (time: number) => setCurrentTime(time);
  const handleExport = () => console.log("Export triggered");
  
  const handleEffectChange = (param: string, value: number) => {
    switch (param) {
      case 'reverbMix': setReverbMix(value); break;
      case 'delayTime': setDelayTime(value); break;
      case 'delayFeedback': setDelayFeedback(value); break;
      case 'delayMix': setDelayMix(value); break;
      case 'limiterThreshold': setLimiterThreshold(value); break;
    }
  };

  return (
    <div style={{ padding: 12 }}>
      {/* Top timeline/arranger */}
      <div style={{ marginBottom: 12 }}>
        <Timeline 
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onSeek={handleSeek}
        />
      </div>

      {/* Main rack (your plugins live here) */}
      <div style={{ marginBottom: 12 }}>
        <EffectsRack 
          reverbMix={reverbMix}
          delayTime={delayTime}
          delayFeedback={delayFeedback}
          delayMix={delayMix}
          limiterThreshold={limiterThreshold}
          onEffectChange={handleEffectChange}
        />
      </div>

      {/* Transport / play controls */}
      <TransportControls 
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onExport={handleExport}
      />
    </div>
  );
}
