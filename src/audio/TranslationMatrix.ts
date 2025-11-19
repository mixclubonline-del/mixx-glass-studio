export type TranslationProfileKey = 'flat' | 'car' | 'clubPA' | 'airpods';
type NonFlatProfileKey = Exclude<TranslationProfileKey, 'flat'>;

export interface TranslationProfileInfo {
  key: TranslationProfileKey;
  title: string;
  description: string;
}

interface ProfileNode {
  key: NonFlatProfileKey;
  title: string;
  description: string;
  input: GainNode;
  gain: GainNode;
}

export interface CalibrationPreset {
  label: string;
  splReference: number;
  description: string;
}

const CALIBRATION_PRESETS: CalibrationPreset[] = [
  { label: 'Studio Nearfield', splReference: 79, description: 'Default Velvet workspace reference.' },
  { label: 'Living Room', splReference: 74, description: 'Small room / apartment translation.' },
  { label: 'Cinema', splReference: 85, description: 'Dolby theatrical mix level.' },
];

export class TranslationMatrix {
  private context: AudioContext;
  private input: GainNode;
  private output: GainNode;
  private dryGain: GainNode;
  private profiles: Record<NonFlatProfileKey, ProfileNode>;
  private active: TranslationProfileKey = 'flat';
  private attached = false;

  constructor(context: AudioContext) {
    this.context = context;
    this.input = context.createGain();
    this.output = context.createGain();
    this.dryGain = context.createGain();
    this.dryGain.gain.value = 1;

    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    this.profiles = this.buildProfiles();
    Object.values(this.profiles).forEach((profile) => {
      this.input.connect(profile.input);
      profile.gain.gain.value = 0;
      profile.gain.connect(this.output);
    });
  }

  attach(source: AudioNode, destination: AudioNode) {
    // Disconnect any existing connections
    if (this.attached) {
      try {
        source.disconnect(this.input);
      } catch {
        // ignore
      }
      try {
        this.output.disconnect();
      } catch {
        // ignore
      }
    }
    // Connect source to input
    source.connect(this.input);
    // Connect output to destination - CRITICAL for audio playback
    this.output.connect(destination);
    this.attached = true;
    
    // Verify connection
    console.log('[TranslationMatrix] Attached:', {
      sourceConnected: true,
      outputConnected: true,
      destination: !!destination,
      dryGain: this.dryGain.gain.value,
      activeProfile: this.active,
    });
  }

  activate(profileKey: TranslationProfileKey) {
    if (!this.attached) {
      return;
    }
    if (this.active === profileKey) {
      return;
    }
    this.active = profileKey;
    if (profileKey === 'flat') {
      this.dryGain.gain.setTargetAtTime(1, this.context.currentTime, 0.01);
      Object.values(this.profiles).forEach((profile) => {
        profile.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.01);
      });
      return;
    }
    this.dryGain.gain.setTargetAtTime(0, this.context.currentTime, 0.01);
    Object.values(this.profiles).forEach((profile) => {
      const value = profile.key === profileKey ? 1 : 0;
      profile.gain.gain.setTargetAtTime(value, this.context.currentTime, 0.01);
    });
  }

  getActiveProfile(): TranslationProfileKey {
    return this.active;
  }

  getProfiles(): TranslationProfileInfo[] {
    return [
      { key: 'flat', title: 'Velvet Flat', description: 'Uncolored reference path.' },
      ...Object.values(this.profiles).map(({ key, title, description }) => ({
        key,
        title,
        description,
      })),
    ];
  }

  getCalibrationPresets(): CalibrationPreset[] {
    return CALIBRATION_PRESETS;
  }

  dispose() {
    try {
      this.input.disconnect();
      this.output.disconnect();
      this.dryGain.disconnect();
      Object.values(this.profiles).forEach((profile) => profile.gain.disconnect());
    } catch {
      // ignore
    }
    this.attached = false;
  }

  private buildProfiles(): Record<NonFlatProfileKey, ProfileNode> {
    const car = this.buildCarProfile();
    const club = this.buildClubProfile();
    const airpods = this.buildAirpodsProfile();

    return {
      car,
      clubPA: club,
      airpods,
    };
  }

  private buildCarProfile(): ProfileNode {
    const input = this.context.createGain();
    const lowShelf = this.context.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 120;
    lowShelf.gain.value = 5.5;

    const midNotch = this.context.createBiquadFilter();
    midNotch.type = 'peaking';
    midNotch.frequency.value = 3100;
    midNotch.Q.value = 1.2;
    midNotch.gain.value = -3.5;

    const highShelf = this.context.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 7500;
    highShelf.gain.value = -4.5;

    const width = this.context.createStereoPanner();
    width.pan.value = -0.08;

    const output = this.context.createGain();
    output.gain.value = 0;

    input.connect(lowShelf);
    lowShelf.connect(midNotch);
    midNotch.connect(highShelf);
    highShelf.connect(width);
    width.connect(output);

    return {
      key: 'car',
      title: 'Car Check',
      description: 'Low-mid push, softened top, narrower spread.',
      input,
      gain: output,
    };
  }

  private buildClubProfile(): ProfileNode {
    const input = this.context.createGain();
    const lowShelf = this.context.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 90;
    lowShelf.gain.value = 6;

    const presence = this.context.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 4500;
    presence.Q.value = 0.8;
    presence.gain.value = 3.2;

    const airShelf = this.context.createBiquadFilter();
    airShelf.type = 'highshelf';
    airShelf.frequency.value = 11000;
    airShelf.gain.value = 2;

    const reverb = this.context.createConvolver();
    reverb.normalize = false;
    reverb.buffer = this.createEarlyReflectionImpulse(0.18, 0.35);

    const output = this.context.createGain();
    output.gain.value = 0;

    input.connect(lowShelf);
    lowShelf.connect(presence);
    presence.connect(airShelf);
    airShelf.connect(reverb);
    reverb.connect(output);

    return {
      key: 'clubPA',
      title: 'Club PA',
      description: 'Pressure-weighted lows, airy top, short hall smear.',
      input,
      gain: output,
    };
  }

  private buildAirpodsProfile(): ProfileNode {
    const input = this.context.createGain();
    const highPass = this.context.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 180;
    highPass.Q.value = 0.9;

    const tilt = this.context.createBiquadFilter();
    tilt.type = 'peaking';
    tilt.frequency.value = 4800;
    tilt.Q.value = 0.7;
    tilt.gain.value = 4.2;

    const harshNotch = this.context.createBiquadFilter();
    harshNotch.type = 'peaking';
    harshNotch.frequency.value = 7800;
    harshNotch.Q.value = 2.5;
    harshNotch.gain.value = -3.5;

    const output = this.context.createGain();
    output.gain.value = 0;

    input.connect(highPass);
    highPass.connect(tilt);
    tilt.connect(harshNotch);
    harshNotch.connect(output);

    return {
      key: 'airpods',
      title: 'AirPods',
      description: 'Lean low-end, bright forward mids, tamed sibilance.',
      input,
      gain: output,
    };
  }

  private createEarlyReflectionImpulse(decay: number, stereoWidth: number): AudioBuffer {
    const length = Math.floor(this.context.sampleRate * 0.25);
    const buffer = this.context.createBuffer(2, length, this.context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const noise = (Math.random() * 2 - 1) * Math.exp(-t / decay);
        const spread = channel === 0 ? 1 : stereoWidth;
        data[i] = noise * spread;
      }
    }
    return buffer;
  }
}

