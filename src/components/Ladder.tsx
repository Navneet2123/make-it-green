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

/** Compact "where am I" strip: how many stages are cleared, and which one is next. */
export function ProgressRow({ cleared, current }: { cleared: number; current: number }) {
  return (
    <div className="progress">
      <div className="progress-head">
        <motion.b key={cleared} initial={{ scale: 1.5, color: '#19C37D' }} animate={{ scale: 1, color: '#1B1F3B' }} transition={{ duration: 0.45 }}>{cleared}</motion.b>
        <span>of {LADDER.length} stages cleared</span>
      </div>
      <div className="dots">
        {LADDER.map((s, i) => (
          <motion.span key={s.n}
            className={['dot-n', i < cleared ? 'done' : '', i === current ? 'next' : '', s.checkpoint ? 'cp' : ''].join(' ')}
            initial={false} animate={i === cleared - 1 ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.45 }}>
            {i < cleared ? '✓' : s.n}
          </motion.span>
        ))}
      </div>
      <div className="progress-next">Next up: <b>{LADDER[current].name}</b> · {LADDER[current].sub}</div>
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
            <span className="step-mark">{done ? '✓' : s.checkpoint ? '⚑' : ''}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}
