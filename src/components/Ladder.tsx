import { motion } from 'framer-motion';
import { LADDER } from '../lib/content';

/** The build pipeline you climb. Compact rail while playing, full list on intro and report. */
export function LadderRail({ stage, cleared }: { stage: number; cleared: number }) {
  return (
    <div className="rail" aria-label={`Stage ${stage + 1} of ${LADDER.length}`}>
      {LADDER.map((s, i) => (
        <span key={s.n} className={['rung', i < cleared ? 'done' : '', i === stage ? 'now' : '', s.checkpoint ? 'cp' : ''].join(' ')} />
      ))}
    </div>
  );
}

export function LadderList({ cleared, current, compact = false }: { cleared: number; current?: number; compact?: boolean }) {
  return (
    <ol className={`ladder ${compact ? 'compact' : ''}`}>
      {[...LADDER].reverse().map((s) => {
        const done = s.n <= cleared;
        const now = current !== undefined && s.n === current + 1;
        return (
          <motion.li key={s.n} className={['step', done ? 'done' : '', now ? 'now' : '', s.checkpoint ? 'cp' : ''].join(' ')}
            initial={false} animate={done ? { scale: [1, 1.03, 1] } : {}} transition={{ duration: 0.4 }}>
            <span className="step-n">{s.n}</span>
            <span className="step-name">{s.name}</span>
            <span className="step-pts mono">{s.points}</span>
            <span className="step-mark">{done ? '✓' : s.checkpoint ? '🔒' : ''}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}
