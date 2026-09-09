import { motion } from 'framer-motion';
import type { Drawn } from '../lib/content';
import type { Lifelines } from '../lib/game';
import { sfx } from '../lib/audio';

const LETTERS = ['A', 'B', 'C', 'D'];

/** Renders `code spans` in question text as monospace chips so code never reads as broken prose. */
function RichText({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`')
      ? <code key={i} className="codechip">{part.slice(1, -1)}</code>
      : <span key={i}>{part}</span>)}</>;
}

export function QuestionCard({ drawn, selected, hidden, poll, revealed, locking, correctIndex, onSelect }: {
  drawn: Drawn; selected: number | null; hidden: number[]; poll: number[] | null;
  revealed: boolean; locking?: boolean; correctIndex: number; onSelect: (i: number) => void;
}) {
  const { question, order } = drawn;
  return (
    <div className={`qwrap ${locking ? 'locking' : ''}`}>
      <div className="qcard">
        <p className="qtext"><RichText text={question.q} /></p>
      </div>
      <div className="opts">
        {order.map((origin, i) => {
          const gone = hidden.includes(i);
          const isCorrect = revealed && i === correctIndex;
          const isWrong = revealed && selected === i && i !== correctIndex;
          const held = locking && selected === i;
          return (
            <motion.button key={i} disabled={gone || revealed || locking}
              whileTap={gone || revealed ? undefined : { scale: 0.98 }}
              style={locking && selected !== i ? { opacity: 0.35 } : undefined}
              animate={isCorrect ? { scale: [1, 1.04, 1] } : isWrong ? { x: [0, -7, 7, -5, 5, 0] } : {}}
              transition={{ duration: 0.42 }}
              className={['opt', selected === i ? 'sel' : '', gone ? 'gone' : '', isCorrect ? 'right' : '', isWrong ? 'wrong' : '', held ? 'held' : ''].join(' ')}
              onClick={() => { if (!gone && !revealed) { sfx.select(); onSelect(i); } }}>
              <span className="opt-l">{LETTERS[i]}</span>
              <span className="opt-t">{gone ? '' : <RichText text={question.options[origin]} />}</span>
              {poll && !gone && <span className="opt-poll" style={{ width: `${poll[i]}%` }} />}
              {poll && !gone && <span className="opt-pct">{poll[i]}%</span>}
              {isCorrect && <span className="opt-mark">✓</span>}
              {isWrong && <span className="opt-mark">✗</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function LifelineBar({ lifelines, disabled, onBisect, onAsk, onRerun }: {
  lifelines: Lifelines; disabled: boolean; onBisect: () => void; onAsk: () => void; onRerun: () => void;
}) {
  const items = [
    { key: 'bisect', icon: '✂', label: '50:50', hint: 'drop 2 wrong', on: lifelines.bisect, fn: onBisect },
    { key: 'ask', icon: '👥', label: 'Ask the team', hint: 'see their vote', on: lifelines.ask, fn: onAsk },
    { key: 'rerun', icon: '↻', label: 'Swap question', hint: 'new one, new clock', on: lifelines.rerun, fn: onRerun },
  ];
  return (
    <div className="lifelines" role="group" aria-label="Lifelines, one use each">
      {items.map((it) => (
        <button key={it.key} className={`ll ${it.on ? '' : 'spent'}`} disabled={!it.on || disabled}
          aria-label={`${it.label}: ${it.hint}`} onClick={() => { sfx.lifeline(); it.fn(); }}>
          <span className="ll-i">{it.icon}</span>
          <span className="ll-t">{it.label}</span>
          <span className="ll-h">{it.on ? it.hint : 'used'}</span>
        </button>
      ))}
    </div>
  );
}
