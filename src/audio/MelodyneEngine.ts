import { invoke } from "@tauri-apps/api/core";
import { AudioBlob, SpectralAnalysisResult, PitchPoint } from "../types/spectral";

/**
 * MelodyneEngine - Frontend bridge for spectral analysis and manipulation.
 */
export class MelodyneEngine {
  private static instance: MelodyneEngine;

  private constructor() {}

  public static getInstance(): MelodyneEngine {
    if (!MelodyneEngine.instance) {
      MelodyneEngine.instance = new MelodyneEngine();
    }
    return MelodyneEngine.instance;
  }

  /**
   * Analyzes an audio clip and returns spectral blobs.
   * @param clipId The ID of the clip to analyze.
   */
  public async analyzeClip(clipId: number): Promise<SpectralAnalysisResult> {
    try {
      // Points is an array of [time, frequency, confidence]
      const points = await invoke<[number, number, number][]>("clip_analyze_pitch_cmd", { clipId });
      
      const pitchPoints: PitchPoint[] = points.map(([time, frequency, confidence]) => ({
        time,
        frequency,
        confidence,
      }));

      const blobs = this.clusterPitchPointsIntoBlobs(pitchPoints);

      return {
        blobs,
        sampleRate: 48000, // TODO: Get actual sample rate from engine
        duration: blobs.length > 0 ? blobs[blobs.length - 1].startTime + blobs[blobs.length - 1].duration : 0,
        peakFrequency: Math.max(...pitchPoints.map(p => p.frequency), 0),
      };
    } catch (error) {
      console.error("MelodyneEngine: Analysis failed", error);
      throw error;
    }
  }

  /**
   * Basic clustering algorithm to group pitch points into "blobs".
   * This is a simplified version for the prototype.
   */
  private clusterPitchPointsIntoBlobs(points: PitchPoint[]): AudioBlob[] {
    const blobs: AudioBlob[] = [];
    if (points.length === 0) return blobs;

    let currentBlobPoints: PitchPoint[] = [points[0]];
    const thresholdSemiotnes = 0.5; // Snap to same blob if within half a semitone

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      const freqRatio = curr.frequency / prev.frequency;
      const semitoneDiff = Math.abs(12 * Math.log2(freqRatio));
      const timeDiff = curr.time - prev.time;

      // If pitch is close and time gap is small, add to current blob
      if (semitoneDiff < thresholdSemiotnes && timeDiff < 0.05) {
        currentBlobPoints.push(curr);
      } else {
        // Finalize current blob
        blobs.push(this.createBlobFromPoints(currentBlobPoints));
        currentBlobPoints = [curr];
      }
    }

    if (currentBlobPoints.length > 0) {
      blobs.push(this.createBlobFromPoints(currentBlobPoints));
    }

    return blobs;
  }

  private createBlobFromPoints(points: PitchPoint[]): AudioBlob {
    const startTime = points[0].time;
    const endTime = points[points.length - 1].time;
    const avgFreq = points.reduce((sum, p) => sum + p.frequency, 0) / points.length;
    const note = Math.round(12 * Math.log2(avgFreq / 440) + 69);

    return {
      id: `blob-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime,
      duration: endTime - startTime,
      pitch: avgFreq,
      note,
      drift: points,
      amplitude: 0.8, // TODO: Extract from loudness analysis
      formantShift: 0,
      velocity: 100,
      isManuallyEdited: false,
    };
  }

  /**
   * Applies a spectral edit (pitch shift and time stretch) to a clip.
   */
  public async applySpectralEdit(
    clipId: number,
    blob: AudioBlob,
    pitchShift: number, // semitones
    timeStretch: number // factor
  ): Promise<void> {
    const sampleRate = 48000; // TODO: Sync with actual engine rate
    const startSample = Math.floor(blob.startTime * sampleRate);
    const numSamples = Math.floor(blob.duration * sampleRate);

    try {
      await invoke("clip_apply_spectral_edit_cmd", {
        clipId,
        startSample,
        numSamples,
        pitchShift,
        timeStretch,
      });
    } catch (error) {
      console.error("MelodyneEngine: Edit failed", error);
      throw error;
    }
  }
}
