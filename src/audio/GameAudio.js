// Web Audio: start chime and game-over collision (no external files)

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function resume() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

/** Pleasant ascending major arpeggio when the run actually begins */
export function playGameStartSound() {
  resume();
  const ctx = getCtx();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.22, now);
  master.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  master.connect(ctx.destination);

  const freqs = [523.25, 659.25, 783.99, 1046.5];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.35, now + 0.02 + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.35 + i * 0.06);
    osc.connect(g);
    g.connect(master);
    osc.start(now + i * 0.07);
    osc.stop(now + 0.5 + i * 0.07);
  });
}

/** Short impact when game ends (wall / police / obstacle / self) */
export function playGameOverCollisionSound(reason = 'default') {
  resume();
  const ctx = getCtx();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.35, now);
  master.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  master.connect(ctx.destination);

  const pitch = reason === 'police' ? 0.75 : reason === 'wall' ? 0.9 : reason === 'obstacle' ? 1.05 : 1;

  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.45, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
  noise.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now);
  noise.stop(now + 0.13);

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(110 * pitch, now);
  osc.frequency.exponentialRampToValueAtTime(45 * pitch, now + 0.25);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.5, now);
  og.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
  osc.connect(og);
  og.connect(master);
  osc.start(now);
  osc.stop(now + 0.3);
}

/** Short “fisss” when eating normal fruit */
export function playEatFruitFisss() {
  resume();
  const ctx = getCtx();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.14, now);
  master.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  master.connect(ctx.destination);

  const nSamples = Math.floor(ctx.sampleRate * 0.14);
  const buffer = ctx.createBuffer(1, nSamples, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < nSamples; i++) {
    const t = i / nSamples;
    data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2200, now);
  filter.frequency.exponentialRampToValueAtTime(5200, now + 0.06);
  filter.Q.setValueAtTime(2.5, now);
  noise.connect(filter);
  filter.connect(master);
  noise.start(now);
  noise.stop(now + 0.15);

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(1650, now + 0.045);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.06, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(g);
  g.connect(master);
  osc.start(now);
  osc.stop(now + 0.11);
}
