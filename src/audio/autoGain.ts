// audio/autoGain.ts
export async function autoGainInsert(ctx: AudioContext, nodeIn: AudioNode, nodeOut: AudioNode) {
  const pre = ctx.createAnalyser();  pre.fftSize = 2048;
  const post = ctx.createAnalyser(); post.fftSize = 2048;
  nodeIn.connect(pre); nodeOut.connect(post);

  // settle briefly so analyzers have data
  await new Promise(r => setTimeout(r, 30));

  const a = new Float32Array(pre.fftSize);
  const b = new Float32Array(post.fftSize);
  pre.getFloatTimeDomainData(a);
  post.getFloatTimeDomainData(b);

  const rms = (arr: Float32Array) => Math.sqrt(arr.reduce((s,x)=>s+x*x,0)/arr.length) + 1e-9;
  const makeupLin = Math.max(0.2, Math.min(5, rms(a)/rms(b)));

  const makeUp = ctx.createGain();
  makeUp.gain.value = makeupLin;
  nodeOut.connect(makeUp);
  return makeUp;
}
