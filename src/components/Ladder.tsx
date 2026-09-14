import { motion } from 'framer-motion';
import { LADDER } from '../lib/content';

import type { AnswerRecord } from '../lib/game';
export type Answer = AnswerRecord;

/** Compact run strip in the header: one mark per question, green or red as you go. */
export function LadderRail({ answers, stage }: { answers: Answer[]; stage: number }) {
  return (
    <div className="rail" aria-label={`Question ${stage + 1} of ${LADDER.length}`}>
      {LADDER.map((s, i) => (
        <span key={s.n} className={['rung', i < answers.length ? 'answered' : '', i === stage ? 'now' : ''].join(' ')} />
      ))}
    </div>
  );
}

/** The report: every question, what you picked, what was right, and why. */
export function AnswerReview({ answers }: { answers: Answer[] }) {
  return (
    <ol className="review">
      {answers.map((a) => (
        <li key={a.stage} className={a.correct ? 'ok' : 'bad'}>
          <div className="rv-head">
            <span className="rv-n mono">{a.stage}</span>
            <span className="rv-stage mono">{a.stageName}</span>
            <span className="rv-mark">{a.correct ? `✓ +${a.points}` : '✗ 0'}</span>
          </div>
          <p className="rv-q">{a.question.replace(/`/g, '')}</p>
          {!a.correct && (
            <p className="rv-yours">You said: <b>{a.chosen ?? 'nothing — the clock ran out'}</b></p>
          )}
          <p className="rv-ans"><span>{a.correct ? 'Correct' : 'Answer'}:</span> <b>{a.correctText.replace(/`/g, '')}</b></p>
          <p className="rv-why">{a.explain}</p>
        </li>
      ))}
    </ol>
  );
}
