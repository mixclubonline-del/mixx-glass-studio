class VelvetLoudnessProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    const sr = sampleRate;
    this.sampleRate = sr;

    this.hpState = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.hsState = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.hpCoeffs = this._computeBiquad('highpass', 60, Math.SQRT1_2);
    this.hsCoeffs = this._computeBiquad('highshelf', 6500, Math.SQRT1_2, 4);

    this.momentaryWindow = [];
    this.shortWindow = [];
    this.integratedBlocks = [];
    this.momentaryDuration = 0;
    this.shortDuration = 0;
    this.integratedDuration = 0;

    this.blockDuration = 0;
    this.metricsInterval = sr * 0.1;
    this.metricsCounter = 0;

    this.prevSample = 0;
    this.currentTruePeak = 0;

    this.port.onmessage = (event) => {
      if (event.data === 'reset') {
        this._reset();
      }
    };
  }

  _reset() {
    this.momentaryWindow = [];
    this.shortWindow = [];
    this.integratedBlocks = [];
    this.momentaryDuration = 0;
    this.shortDuration = 0;
    this.integratedDuration = 0;
    this.metricsCounter = 0;
    this.prevSample = 0;
    this.currentTruePeak = 0;
  }

  _computeBiquad(type, freq, q, gainDb = 0) {
    const sr = this.sampleRate;
    const w0 = (2 * Math.PI * freq) / sr;
    const cosw0 = Math.cos(w0);
    const sinw0 = Math.sin(w0);
    const alpha = sinw0 / (2 * q);
    const A = Math.pow(10, gainDb / 40);

    let b0, b1, b2, a0, a1, a2;

    switch (type) {
      case 'highpass':
        b0 = (1 + cosw0) / 2;
        b1 = -(1 + cosw0);
        b2 = (1 + cosw0) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cosw0;
        a2 = 1 - alpha;
        break;
      case 'highshelf':
        const common = 2 * Math.sqrt(A) * alpha;
        b0 =
          A *
          ((A + 1) +
            (A - 1) * cosw0 +
            common);
        b1 =
          -2 *
          A *
          ((A - 1) +
            (A + 1) * cosw0);
        b2 =
          A *
          ((A + 1) +
            (A - 1) * cosw0 -
            common);
        a0 =
          (A + 1) -
          (A - 1) * cosw0 +
          common;
        a1 =
          2 *
          ((A - 1) +
            (A + 1) * cosw0);
        a2 =
          (A + 1) -
          (A - 1) * cosw0 -
          common;
        break;
      default:
        b0 = 1;
        b1 = 0;
        b2 = 0;
        a0 = 1;
        a1 = 0;
        a2 = 0;
    }

    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0,
    };
  }

  _processBiquad(coeffs, state, inputSample) {
    const y =
      coeffs.b0 * inputSample +
      coeffs.b1 * state.x1 +
      coeffs.b2 * state.x2 -
      coeffs.a1 * state.y1 -
      coeffs.a2 * state.y2;

    state.x2 = state.x1;
    state.x1 = inputSample;
    state.y2 = state.y1;
    state.y1 = y;

    return y;
  }

  _toLUFS(meanSquare) {
    if (meanSquare <= 0) {
      return -Infinity;
    }
    return -0.691 + 10 * Math.log10(meanSquare);
  }

  _fromLUFS(lufs) {
    return Math.pow(10, (lufs + 0.691) / 10);
  }

  _pushWindow(window, durationRef, maxDuration, block) {
    window.push(block);
    durationRef.value += block.duration;
    while (durationRef.value > maxDuration && window.length > 0) {
      const removed = window.shift();
      durationRef.value -= removed.duration;
    }
  }

  _computeAveragedLUFS(window, duration) {
    if (duration.value === 0) return -Infinity;
    let energySum = 0;
    window.forEach((block) => {
      energySum += block.energy * block.duration;
    });
    const meanSquare = energySum / duration.value;
    return this._toLUFS(meanSquare);
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0) return true;

    const channels = input.length;
    const frames = input[0].length;
    let blockEnergy = 0;

    for (let channel = 0; channel < output.length; channel++) {
      const out = output[channel];
      const inp = input[channel] || input[0];
      for (let i = 0; i < frames; i++) {
        out[i] = inp[i];
      }
    }

    for (let i = 0; i < frames; i++) {
      let sample = 0;
      for (let ch = 0; ch < channels; ch++) {
        sample += input[ch][i] || 0;
      }
      sample /= channels || 1;

      const weighted = this._processBiquad(
        this.hsCoeffs,
        this.hsState,
        this._processBiquad(this.hpCoeffs, this.hpState, sample)
      );

      blockEnergy += weighted * weighted;

      const segmentPeak = this._segmentTruePeak(sample);
      if (segmentPeak > this.currentTruePeak) {
        this.currentTruePeak = segmentPeak;
      }
    }

    const blockMean = blockEnergy / frames;
    const durationSeconds = frames / this.sampleRate;

    const momentaryWrapper = { value: this.momentaryDuration };
    const shortWrapper = { value: this.shortDuration };
    const integratedWrapper = { value: this.integratedDuration };

    this._pushWindow(
      this.momentaryWindow,
      momentaryWrapper,
      0.4,
      { energy: blockMean, duration: durationSeconds }
    );
    this.momentaryDuration = momentaryWrapper.value;

    this._pushWindow(
      this.shortWindow,
      shortWrapper,
      3,
      { energy: blockMean, duration: durationSeconds }
    );
    this.shortDuration = shortWrapper.value;

    this.integratedBlocks.push({
      energy: blockMean,
      duration: durationSeconds,
    });
    this.integratedDuration += durationSeconds;

    this.metricsCounter += frames;

    if (this.metricsCounter >= this.metricsInterval) {
      const momentaryLUFS = this._computeAveragedLUFS(this.momentaryWindow, { value: this.momentaryDuration });
      const shortTermLUFS = this._computeAveragedLUFS(this.shortWindow, { value: this.shortDuration });
      const integratedLUFS = this._computeIntegratedLUFS();
      const truePeak = this.currentTruePeak;
      const truePeakDb = truePeak > 0 ? 20 * Math.log10(truePeak) : -Infinity;

      this.port.postMessage({
        momentaryLUFS,
        shortTermLUFS,
        integratedLUFS,
        truePeakDb,
      });

      this.metricsCounter = 0;
      this.currentTruePeak = 0;
    }

    return true;
  }

  _computeIntegratedLUFS() {
    if (this.integratedDuration === 0) {
      return -Infinity;
    }
    let totalEnergy = 0;
    this.integratedBlocks.forEach((block) => {
      totalEnergy += block.energy * block.duration;
    });

    const meanSquareUngated = totalEnergy / this.integratedDuration;
    const ungatedLUFS = this._toLUFS(meanSquareUngated);

    const thresholdLUFS = Math.max(ungatedLUFS - 10, -70);
    const thresholdLinear = this._fromLUFS(thresholdLUFS);

    let gatedEnergy = 0;
    let gatedDuration = 0;
    this.integratedBlocks.forEach((block) => {
      if (block.energy >= thresholdLinear) {
        gatedEnergy += block.energy * block.duration;
        gatedDuration += block.duration;
      }
    });

    if (gatedDuration === 0) {
      return -Infinity;
    }

    const meanSquare = gatedEnergy / gatedDuration;
    return this._toLUFS(meanSquare);
  }

  _segmentTruePeak(currentSample) {
    const prev = this.prevSample;
    let max = Math.max(Math.abs(currentSample), Math.abs(prev));

    const diff = currentSample - prev;
    const fractions = [0.25, 0.5, 0.75];

    for (let i = 0; i < fractions.length; i++) {
      const interp = prev + diff * fractions[i];
      const absInterp = Math.abs(interp);
      if (absInterp > max) {
        max = absInterp;
      }
    }

    this.prevSample = currentSample;
    return max;
  }
}

registerProcessor('velvet-loudness-processor', VelvetLoudnessProcessor);





