/**
 * Studio Page - Main DAW interface with view routing
 */
import { useState } from "react";
import { useViewStore } from "@/store/viewStore";
import { EffectsRack } from "../studio/components/EffectsRack";
import { Timeline } from "../studio/components/Timeline";
import { TransportControls } from "../studio/components/TransportControls";
import { MixxAIStudio } from "../studio/components/AI/MixxAIStudio";
import { ViewSwitcher } from "../studio/components/Navigation/ViewSwitcher";
import { ViewContainer } from "../studio/components/Navigation/ViewContainer";
import { CollapsibleMeteringPanel } from "../studio/components/Metering/CollapsibleMeteringPanel";

export default function StudioPage() {
  const { currentView } = useViewStore();
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
    <div className="h-screen flex flex-col bg-background">
      {/* View Switcher */}
      <div className="p-3 border-b border-border/30">
        <ViewSwitcher />
      </div>

      {/* View Content */}
      <ViewContainer className="flex-1">
        {currentView === 'ai-studio' ? (
          <MixxAIStudio />
        ) : (
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
        )}
      </ViewContainer>

      {/* Global Collapsible Metering Panel - accessible from View menu */}
      <CollapsibleMeteringPanel />
    </div>
  );
}
