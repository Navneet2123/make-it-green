import { motion } from 'framer-motion';

/** Countdown ring with the seconds animating inside it. Turns amber, then red and pulses. */
export function Timer({ left, total, paused }: { left: number; total: number; paused: boolean }) {
  const r = 26, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, left / total));
  const secs = Math.ceil(left);
  const urgent = left <= 5 && left > 0;
  const state = left <= 5 ? 'red' : left <= 10 ? 'amber' : 'ok';
  return (
    <div className={`timer ${state} ${paused ? 'paused' : ''}`} role="timer" aria-label={`${secs} seconds left`}>
      <svg viewBox="0 0 64 64" width="60" height="60">
        <circle cx="32" cy="32" r={r} className="timer-track" />
        <circle cx="32" cy="32" r={r} className="timer-bar" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 32 32)" />
      </svg>
      <motion.span key={secs} className="timer-num"
        initial={urgent ? { scale: 1.5, opacity: 0.4 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
        {secs}
      </motion.span>
      {urgent && <span className="timer-ping" />}
    </div>
  );
}
