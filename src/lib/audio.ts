let ctx: AudioContext | null = null;
let muted = false;
export const setMuted = (m: boolean) => { muted = m; };
export const isMuted = () => muted;
function ac() { if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
function tone(freq: number, dur = 0.12, type: OscillatorType = 'sine', vol = 0.18, delay = 0, slide?: number) {
  if (muted) return;
  try {
    const c = ac(); const t = c.currentTime + delay;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  } catch {}
}
export const sfx = {
  tap: () => tone(700, 0.05, 'triangle', 0.12),
  select: () => tone(520, 0.07, 'triangle', 0.14, 0, 780),
  pass: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'triangle', 0.16, i * 0.07)); tone(1568, 0.3, 'sine', 0.08, 0.2); },
  nudge: () => { tone(420, 0.12, 'triangle', 0.12, 0, 360); tone(360, 0.14, 'triangle', 0.1, 0.12); },
  fail: () => { tone(220, 0.2, 'sawtooth', 0.1, 0, 160); tone(160, 0.3, 'sawtooth', 0.1, 0.15, 110); },
  level: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.06)),
  report: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.35, 'triangle', 0.14, i * 0.09)),
};
