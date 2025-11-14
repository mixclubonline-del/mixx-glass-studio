class VelvetDitherProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.noiseAmplitude = Math.pow(10, -90 / 20); // ~ -90 dBFS
  }

  _tpdf() {
    return (Math.random() + Math.random() - 1) * this.noiseAmplitude;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    for (let ch = 0; ch < output.length; ch++) {
      const inChannel = input[ch] || input[0];
      const outChannel = output[ch];
      for (let i = 0; i < outChannel.length; i++) {
        outChannel[i] = inChannel[i] + this._tpdf();
      }
    }

    return true;
  }
}

registerProcessor('velvet-dither-processor', VelvetDitherProcessor);





