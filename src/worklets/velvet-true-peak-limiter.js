class VelvetTruePeakLimiter extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'threshold',
        defaultValue: -1,
        minValue: -12,
        maxValue: 0,
      },
    ];
  }

  constructor() {
    super();
    this.sampleRate = sampleRate;
    this.lookAheadSeconds = 0.005;
    this.lookAheadSamples = Math.max(
      1,
      Math.floor(this.sampleRate * this.lookAheadSeconds)
    );
    this.delayBuffers = [
      new Float32Array(this.lookAheadSamples + 512),
      new Float32Array(this.lookAheadSamples + 512),
    ];
    this.writeIndex = 0;
    this.currentGain = 1;
    this.targetGain = 1;
    this.prevSamples = [0, 0];
    this.attackCoeff = Math.exp(-1 / (this.sampleRate * 0.0008));
    this.releaseCoeff = Math.exp(-1 / (this.sampleRate * 0.04));

    this.port.onmessage = (event) => {
      if (event.data?.thresholdDb !== undefined) {
        this.thresholdLinear = this._dbToLinear(event.data.thresholdDb);
      }
    };

    this.thresholdLinear = this._dbToLinear(-1);
  }

  _dbToLinear(db) {
    return Math.pow(10, db / 20);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    const channels = input.length;
    const frames = input[0].length;
    const thresholdParam = parameters.threshold;

    for (let i = 0; i < frames; i++) {
      const thresholdDb = thresholdParam.length > 1 ? thresholdParam[i] : thresholdParam[0];
      this.thresholdLinear = this._dbToLinear(thresholdDb);

      let maxPeak = 0;

      for (let ch = 0; ch < channels; ch++) {
        const buffer = this.delayBuffers[ch];
        const bufferLength = buffer.length;
        const writePos = this.writeIndex % bufferLength;
        const sample = input[ch][i] || 0;

        buffer[writePos] = sample;

        const prev = this.prevSamples[ch];
        const diff = sample - prev;
        const fractions = [0.25, 0.5, 0.75];

        let segmentPeak = Math.max(Math.abs(sample), Math.abs(prev));
        for (let f = 0; f < fractions.length; f++) {
          const interp = prev + diff * fractions[f];
          const absInterp = Math.abs(interp);
          if (absInterp > segmentPeak) {
            segmentPeak = absInterp;
          }
        }

        if (segmentPeak > maxPeak) {
          maxPeak = segmentPeak;
        }

        this.prevSamples[ch] = sample;
      }

      if (maxPeak > this.thresholdLinear) {
        const desired = this.thresholdLinear / (maxPeak + 1e-9);
        this.targetGain = Math.min(this.targetGain, desired);
      } else {
        this.targetGain += (1 - this.targetGain) * (1 - this.releaseCoeff);
      }

      if (this.targetGain < this.currentGain) {
        this.currentGain =
          this.targetGain + (this.currentGain - this.targetGain) * this.attackCoeff;
      } else {
        this.currentGain =
          this.targetGain + (this.currentGain - this.targetGain) * this.releaseCoeff;
      }

      const readIndex =
        (this.writeIndex + 1 + this.lookAheadSamples) % this.delayBuffers[0].length;

      for (let ch = 0; ch < channels; ch++) {
        const buffer = this.delayBuffers[ch];
        const delayedSample = buffer[readIndex];
        output[ch][i] = delayedSample * this.currentGain;
      }

      this.writeIndex = (this.writeIndex + 1) % this.delayBuffers[0].length;
    }

    return true;
  }
}

registerProcessor('velvet-true-peak-limiter', VelvetTruePeakLimiter);

