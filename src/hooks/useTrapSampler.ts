import { useCallback, useMemo, useRef, useState } from "react";
import type {
  TrapPadId,
  TrapPadLayerState,
  TrapPadState,
  TrapSampleWaveform,
  TrapSamplerLayerId,
  TrapSamplerSnapshot,
} from "../types/sampler";
import { TRAP_PAD_IDS } from "../types/sampler";
import {
  TRACK_COLOR_SWATCH,
  derivePulsePalette,
  hexToRgba,
} from "../utils/ALS";
import { publishAlsSignal } from "../state/flowSignals";

const PAD_BANKS: TrapPadState["bank"][] = [
  "Pit",
  "Radiant",
  "Slick",
  "Sculpt",
];

const DEFAULT_LAYERS: Record<TrapSamplerLayerId, Omit<TrapPadLayerState, "sampleName">> =
  {
    sub: {
      id: "sub",
      label: "Layer 1 · Sub-Tone",
      color: "cyan",
      drive: 0.25,
      decay: 0.6,
      volume: 0.88,
      pitch: 0,
    },
    body: {
      id: "body",
      label: "Layer 2 · Grit/Color",
      color: "magenta",
      drive: 0.42,
      decay: 0.48,
      volume: 0.72,
      pitch: 0,
    },
    attack: {
      id: "attack",
      label: "Layer 3 · Attack/Click",
      color: "purple",
      drive: 0.18,
      decay: 0.32,
      volume: 0.68,
      pitch: 0,
    },
  };

const SAMPLE_NAMES = [
  "Sonic Bloom",
  "Dirt Circuit",
  "Neon Veil",
  "Grav Glide",
  "Chrome Sweep",
  "Night Pulse",
  "Phase Ember",
  "Tundra Low",
  "Velvet Knock",
  "Shadow Sub",
  "Vapor Kick",
  "Halo Punch",
  "Glare Hit",
  "Wraith Thump",
  "Azure Slam",
  "Ghost Switch",
];

const DEFAULT_SAMPLE_RATE = 44100;
const ACTIVE_DECAY_MS = 220;

const createWaveStub = (padIndex: number): TrapSampleWaveform => {
  const length = 512;
  const samples = new Float32Array(length);
  const baseFreq = 32 + padIndex * 1.5;
  for (let i = 0; i < length; i += 1) {
    const t = i / length;
    const envelope = Math.exp(-3 * t);
    const harmonic =
      Math.sin((i / DEFAULT_SAMPLE_RATE) * Math.PI * baseFreq) * envelope;
    const overtone =
      Math.sin((i / DEFAULT_SAMPLE_RATE) * Math.PI * (baseFreq * 1.5)) *
      envelope *
      0.4;
    samples[i] = harmonic + overtone;
  }
  return {
    padId: TRAP_PAD_IDS[padIndex],
    samples,
    sampleRate: DEFAULT_SAMPLE_RATE,
  };
};

const buildInitialPads = (): TrapPadState[] => {
  return TRAP_PAD_IDS.map((id, index) => {
    const bank = PAD_BANKS[index % PAD_BANKS.length];
    const sampleName = SAMPLE_NAMES[index % SAMPLE_NAMES.length];
    return {
      id,
      label: `Pad ${index + 1}`,
      bank,
      layers: {
        sub: {
          ...DEFAULT_LAYERS.sub,
          sampleName: sampleName,
        },
        body: {
          ...DEFAULT_LAYERS.body,
          sampleName: `${sampleName} · body`,
        },
        attack: {
          ...DEFAULT_LAYERS.attack,
          sampleName: `${sampleName} · attack`,
        },
      },
    };
  });
};

interface UseTrapSamplerOptions {
  tempoBpm?: number;
}

export function useTrapSampler({
  tempoBpm = 140,
}: UseTrapSamplerOptions = {}): {
  snapshot: TrapSamplerSnapshot;
  triggerPad: (padId: TrapPadId, velocity?: number) => void;
  setFocusedPad: (padId: TrapPadId) => void;
  setChopSensitivity: (value: number) => void;
  setPhaseOffset: (value: number) => void;
  updateLayer: (
    padId: TrapPadId,
    layerId: TrapSamplerLayerId,
    patch: Partial<TrapPadLayerState>
  ) => void;
  getPadWaveform: (padId: TrapPadId) => TrapSampleWaveform;
} {
  const [pads, setPads] = useState<TrapPadState[]>(buildInitialPads);
  const [focusedPadId, setFocusedPadId] = useState<TrapPadId>("pad-1");
  const [activePadId, setActivePadId] = useState<TrapPadId | null>(null);
  const [lastVelocity, setLastVelocity] = useState(0.85);
  const [chopSensitivity, setChopSensitivityState] = useState(0.54);
  const [phaseOffset, setPhaseOffsetState] = useState(0.38);
  const [waveform, setWaveform] = useState<TrapSampleWaveform | null>(() =>
    createWaveStub(0)
  );

  const activeTimeoutRef = useRef<number | null>(null);

  const resolvePadIndex = useCallback(
    (padId: TrapPadId) => pads.findIndex((pad) => pad.id === padId),
    [pads]
  );

  const handlePublishAlsPulse = useCallback(
    (pad: TrapPadState, velocity: number) => {
      const baseLayer = pad.layers.sub;
      const swatch = TRACK_COLOR_SWATCH[baseLayer.color];
      const intensity = Math.min(1, 0.35 + velocity * 0.75);
      const pulse = derivePulsePalette(baseLayer.color, intensity, velocity);
      publishAlsSignal({
        source: "sampler",
        meta: {
          padId: pad.id,
          padLabel: pad.label,
          bank: pad.bank,
          intensity,
          glow: hexToRgba(swatch.glow, 0.85),
        },
        master: {
          color: pulse.base,
          glowColor: pulse.glow,
          temperature: intensity > 0.7 ? "hot" : intensity > 0.45 ? "warm" : "cool",
          intensity,
          pulse: velocity,
          flow: 0.6 + velocity * 0.35,
        },
      });
    },
    []
  );

  const triggerPad = useCallback(
    (padId: TrapPadId, velocity = 0.92) => {
      const padIndex = resolvePadIndex(padId);
      if (padIndex === -1) return;
      const pad = pads[padIndex];

      if (activeTimeoutRef.current) {
        window.clearTimeout(activeTimeoutRef.current);
      }

      setFocusedPadId(padId);
      setActivePadId(padId);
      setLastVelocity(velocity);
      setWaveform(createWaveStub(padIndex));
      handlePublishAlsPulse(pad, velocity);

      activeTimeoutRef.current = window.setTimeout(() => {
        setActivePadId((current) => (current === padId ? null : current));
        activeTimeoutRef.current = null;
      }, ACTIVE_DECAY_MS);
    },
    [handlePublishAlsPulse, pads, resolvePadIndex]
  );

  const setFocusedPad = useCallback((padId: TrapPadId) => {
    if (resolvePadIndex(padId) === -1) return;
    setFocusedPadId(padId);
  }, [resolvePadIndex]);

  const setChopSensitivity = useCallback((value: number) => {
    setChopSensitivityState(Math.min(1, Math.max(0, value)));
  }, []);

  const setPhaseOffset = useCallback((value: number) => {
    setPhaseOffsetState(Math.min(1, Math.max(0, value)));
  }, []);

  const updateLayer = useCallback(
    (padId: TrapPadId, layerId: TrapSamplerLayerId, patch: Partial<TrapPadLayerState>) => {
      setPads((prev) =>
        prev.map((pad) => {
          if (pad.id !== padId) return pad;
          const layer = pad.layers[layerId];
          return {
            ...pad,
            layers: {
              ...pad.layers,
              [layerId]: {
                ...layer,
                ...patch,
                drive:
                  patch.drive !== undefined
                    ? Math.min(1, Math.max(0, patch.drive))
                    : layer.drive,
                decay:
                  patch.decay !== undefined
                    ? Math.min(1, Math.max(0, patch.decay))
                    : layer.decay,
                volume:
                  patch.volume !== undefined
                    ? Math.min(1, Math.max(0, patch.volume))
                    : layer.volume,
                pitch:
                  patch.pitch !== undefined
                    ? Math.min(12, Math.max(-12, patch.pitch))
                    : layer.pitch,
              },
            },
          };
        })
      );
    },
    []
  );

  const getPadWaveform = useCallback(
    (padId: TrapPadId) => {
      const index = resolvePadIndex(padId);
      return createWaveStub(Math.max(0, index));
    },
    [resolvePadIndex]
  );

  const snapshot: TrapSamplerSnapshot = useMemo(
    () => ({
      pads,
      focusedPadId,
      activePadId,
      lastVelocity,
      chopSensitivity,
      phaseOffset,
      waveform,
    }),
    [pads, focusedPadId, activePadId, lastVelocity, chopSensitivity, phaseOffset, waveform]
  );

  return {
    snapshot,
    triggerPad,
    setFocusedPad,
    setChopSensitivity,
    setPhaseOffset,
    updateLayer,
    getPadWaveform,
  };
}



