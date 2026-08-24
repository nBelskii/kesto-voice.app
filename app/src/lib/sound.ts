// Small synthesized notification sounds — no audio assets to ship, just Web
// Audio oscillators. Kept deliberately simple: two short, distinct cues.

function tone(freq: number, startAt: number, durationSec: number, ctx: AudioContext, gainValue = 0.12) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
  gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + startAt + 0.02);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startAt + durationSec);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + startAt);
  osc.stop(ctx.currentTime + startAt + durationSec + 0.02);
}

export function playIncomingCallSound() {
  const ctx = new AudioContext();
  tone(660, 0, 0.18, ctx);
  tone(880, 0.2, 0.18, ctx);
  tone(660, 0.5, 0.18, ctx);
  tone(880, 0.7, 0.18, ctx);
  setTimeout(() => ctx.close(), 1200);
}

export function playMessageSound() {
  const ctx = new AudioContext();
  tone(760, 0, 0.09, ctx, 0.08);
  tone(1000, 0.08, 0.12, ctx, 0.08);
  setTimeout(() => ctx.close(), 400);
}
