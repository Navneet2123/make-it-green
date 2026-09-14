import { motion } from 'framer-motion';
import { LADDER } from '../lib/content';

export interface Answer { concept: string; correct: boolean }

/** Compact run strip in the header: one mark per question, green or red as you go. */
export function LadderRail({ answers, stage }: { answers: Answer[]; stage: number }) {
  return (
    <div className="rail" aria-label={`Question ${stage + 1} of ${LADDER.length}`}>
      {LADDER.map((s, i) => {
        const a = answers[i];
        return <span key={s.n} className={['rung', a ? (a.correct ? 'done' : 'miss') : '', i === stage ? 'now' : ''].join(' ')} />;
      })}
    </div>
  );
}

/** Full list, used on the final report: every question with how it went. */
export function LadderList({ answers }: { answers: Answer[] }) {
  return (
    <ol className="ladder compact">
      {[...LADDER].reverse().map((s) => {
        const a = answers[s.n - 1];
        return (
          <motion.li key={s.n} className={['step', a ? (a.correct ? 'done' : 'missed') : 'skipped'].join(' ')} initial={false}>
            <span className="step-n">{s.n}</span>
            <span className="step-name">{s.name}</span>
            <span className="step-pts mono">{a?.correct ? `+${s.points}` : '0'}</span>
            <span className="step-mark">{a ? (a.correct ? '✓' : '✗') : '–'}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}
