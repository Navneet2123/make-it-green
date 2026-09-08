import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Item } from '../lib/content';
import { sfx } from '../lib/audio';

export interface ItemProps { item: Item; locked: boolean; onSubmit: (pass: boolean, retried: boolean) => void }

const shuffle = <T,>(arr: T[], seed: number) => { const a = [...arr]; let s = seed; for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function RunButton({ disabled, onClick, label = 'Run test' }: { disabled?: boolean; onClick: () => void; label?: string }) {
  return <button className="btn primary big" disabled={disabled} onClick={onClick}>▶ {label}</button>;
}

/** One free retry: first wrong answer shows a nudge instead of failing. */
function useRetry(onSubmit: ItemProps['onSubmit']) {
  const [nudge, setNudge] = useState<string | null>(null);
  const used = useRef(false); // ref: always current, even if a click lands before a re-render
  const submit = (pass: boolean, message: string) => {
    if (pass) { onSubmit(true, used.current); return; }
    if (!used.current) { used.current = true; setNudge(message); sfx.nudge(); return; }
    setNudge(null);
    onSubmit(false, true);
  };
  const clear = () => setNudge(null);
  return { nudge, submit, clear };
}
function Nudge({ text }: { text: string | null }) {
  if (!text) return null;
  return <motion.div className="nudge" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>🤔 {text}</motion.div>;
}

/* ---------- Level 1: sort ---------- */
export function SortItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'sort') return null;
  const [picked, setPicked] = useState<boolean[]>(() => item.cards.map(() => false));
  const retry = useRetry(onSubmit);
  const toggle = (i: number) => { if (locked) return; sfx.select(); retry.clear(); setPicked((p) => p.map((v, j) => (j === i ? !v : v))); };
  const wrongCount = item.cards.filter((c, i) => c.robot !== picked[i]).length;
  return (
    <div className="item">
      <p className="prompt">{item.prompt}</p>
      <p className="hint">{item.hint}</p>
      <div className="stack">
        {item.cards.map((c, i) => (
          <motion.button key={i} whileTap={locked ? undefined : { scale: 0.97 }}
            className={['pick', picked[i] ? 'on' : '', locked && c.robot ? 'reveal-pass' : '', locked && !c.robot && picked[i] ? 'reveal-fail' : ''].join(' ')}
            onClick={() => toggle(i)} aria-pressed={picked[i]}>
            <span className="pick-badge">{picked[i] ? '🤖' : '🧑'}</span>
            <span>{c.text}</span>
            <span className="pick-tag">{picked[i] ? 'Robot' : 'Human'}</span>
          </motion.button>
        ))}
      </div>
      <Nudge text={retry.nudge} />
      {!locked && <RunButton disabled={!picked.some(Boolean)} onClick={() => retry.submit(wrongCount === 0, wrongCount === 1 ? 'Close! One card is on the wrong side. Try once more.' : `Not quite. ${wrongCount} cards are on the wrong side. Try once more.`)} />}
    </div>
  );
}

/* ---------- choice ---------- */
export function ChoiceItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'choice') return null;
  const [sel, setSel] = useState<number | null>(null);
  const retry = useRetry(onSubmit);
  return (
    <div className="item">
      <p className="prompt">{item.prompt}</p>
      <div className="stack">
        {item.options.map((o, i) => (
          <motion.button key={i} whileTap={locked ? undefined : { scale: 0.97 }}
            className={['pick', sel === i ? 'on' : '', locked && i === item.answer ? 'reveal-pass' : '', locked && sel === i && i !== item.answer ? 'reveal-fail' : ''].join(' ')}
            onClick={() => { if (!locked) { sfx.select(); retry.clear(); setSel(i); } }}>
            <span className="pick-badge mono">{String.fromCharCode(65 + i)}</span><span>{o}</span>
          </motion.button>
        ))}
      </div>
      <Nudge text={retry.nudge} />
      {!locked && <RunButton disabled={sel === null} onClick={() => retry.submit(sel === item.answer, 'Not that one. Think about what the robot is good at, and try once more.')} />}
    </div>
  );
}

/* ---------- Level 2: order ---------- */
export function OrderItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'order') return null;
  const pool = useMemo(() => shuffle(item.steps.map((_, i) => i), item.steps.length * 7 + 3), [item]);
  const [seq, setSeq] = useState<number[]>([]);
  const retry = useRetry(onSubmit);
  const add = (i: number) => { if (locked) return; sfx.select(); retry.clear(); setSeq((s) => [...s, i]); };
  const remove = (pos: number) => { if (locked) return; sfx.tap(); retry.clear(); setSeq((s) => s.filter((_, j) => j !== pos)); };
  const groups = item.interchangeable ?? [];
  const correctAt = (pos: number) => { const g = groups.find((gr) => gr.includes(pos)); return seq[pos] === pos || (!!g && g.includes(seq[pos]) && g.every((p) => g.includes(seq[p]))); };
  const wrong = seq.length === item.steps.length ? item.steps.filter((_, pos) => !correctAt(pos)).length : item.steps.length;
  const allRight = wrong === 0;
  return (
    <div className="item">
      <p className="prompt">{item.prompt}</p>
      <ol className="seq">
        {item.steps.map((_, pos) => (
          <li key={pos} className={['slot', seq[pos] !== undefined ? 'filled' : '', locked && seq[pos] !== undefined ? (correctAt(pos) ? 'reveal-pass' : 'reveal-fail') : ''].join(' ')} onClick={() => seq[pos] !== undefined && remove(pos)}>
            <span className="slot-n">{pos + 1}</span>
            <span className="mono">{seq[pos] !== undefined ? item.steps[seq[pos]] : '—'}</span>
            {!locked && seq[pos] !== undefined && <span className="slot-x" aria-label="Put back">✕</span>}
          </li>
        ))}
      </ol>
      {!locked && seq.length > 0 && seq.length < item.steps.length && <p className="hint">Tap a placed step to put it back.</p>}
      {!locked && (
        <div className="chips">
          {pool.filter((i) => !seq.includes(i)).map((i) => (
            <motion.button key={i} layout whileTap={{ scale: 0.95 }} className="chip mono" onClick={() => add(i)}>{item.steps[i]}</motion.button>
          ))}
        </div>
      )}
      {locked && !allRight && (
        <div className="answer-box">
          <div className="eyebrow mono">the right order</div>
          <ol className="answer-list mono">{item.steps.map((st, i) => <li key={i}><span>{i + 1}</span>{st}</li>)}</ol>
        </div>
      )}
      {locked && allRight && <p className="hint">Green = every step in the right place.</p>}
      <Nudge text={retry.nudge} />
      {!locked && <RunButton disabled={seq.length !== item.steps.length} onClick={() => retry.submit(allRight, wrong === 1 ? 'Close! One step is out of place. Tap it to put it back and try once more.' : `Not quite. ${wrong} steps are out of place. Tap steps to put them back and try once more.`)} />}
    </div>
  );
}

/* ---------- Level 3: locate on a mini page ---------- */
const ELEMENTS: { id: string; tag: string; render: () => JSX.Element }[] = [
  { id: 'email', tag: '<input id="email" name="email">', render: () => <div className="mini-input">you@example.com</div> },
  { id: 'password', tag: '<input id="password" name="password" type="password">', render: () => <div className="mini-input">••••••••</div> },
  { id: 'login', tag: '<button id="login">Log in</button>', render: () => <div className="mini-btn">Log in</div> },
  { id: 'forgot', tag: '<a class="ghost">Forgot password?</a>', render: () => <div className="mini-link muted">Forgot password?</div> },
  { id: 'signup', tag: '<a id="signup">Sign up</a>', render: () => <div className="mini-link">Sign up</div> },
];
export function LocateItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'locate') return null;
  const [sel, setSel] = useState<string | null>(null);
  const retry = useRetry(onSubmit);
  const selected = ELEMENTS.find((e) => e.id === sel);
  return (
    <div className="item">
      <p className="prompt">{item.prompt}</p>
      {item.hint && <p className="hint">{item.hint}</p>}
      <div className="locator mono">{item.locator}</div>
      <div className="mini">
        <div className="mini-bar"><span /><span /><span /><em>myapp.test/login</em></div>
        <div className="mini-body">
          <div className="mini-title">MyApp</div>
          {ELEMENTS.map((e) => (
            <button key={e.id} className={['mini-el', sel === e.id ? 'on' : '', locked && e.id === item.target ? 'reveal-pass' : '', locked && sel === e.id && e.id !== item.target ? 'reveal-fail' : ''].join(' ')}
              onClick={() => { if (!locked) { sfx.select(); retry.clear(); setSel(e.id); } }} aria-label={e.tag}>
              {e.render()}
            </button>
          ))}
        </div>
        <div className="inspector mono"><span className="insp-k">tag</span>{selected ? selected.tag : 'tap a button or box to see its code name'}</div>
      </div>
      <Nudge text={retry.nudge} />
      {!locked && <RunButton disabled={!sel} onClick={() => retry.submit(sel === item.target, 'Not that one. Look at the tag in the dark bar: does it match the address? Try once more.')} />}
    </div>
  );
}

/* ---------- Level 4: judge (no retry: it is a coin flip) ---------- */
export function JudgeItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'judge') return null;
  return (
    <div className="item">
      <p className="prompt">Would the robot's check pass?</p>
      <div className="judge">
        <div className="judge-row"><span className="judge-k">expected</span><span className="judge-v mono">{item.expected}</span></div>
        <div className="judge-eq">=?</div>
        <div className="judge-row"><span className="judge-k">actual</span><span className="judge-v mono">{item.actual}</span></div>
      </div>
      {!locked && (
        <div className="two">
          <button className="btn pass big" onClick={() => onSubmit(item.pass === true, false)}>✓ It passes</button>
          <button className="btn fail big" onClick={() => onSubmit(item.pass === false, false)}>✗ It fails</button>
        </div>
      )}
      {locked && <p className="hint">The robot's check would <b className={item.pass ? 'c-pass' : 'c-fail'}>{item.pass ? 'PASS' : 'FAIL'}</b>.</p>}
    </div>
  );
}

/* ---------- Level 5: fix ---------- */
export function FixItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'fix') return null;
  const [sel, setSel] = useState<number | null>(null);
  const retry = useRetry(onSubmit);
  const fixedRight = locked && sel === item.answer;
  return (
    <div className="item">
      <p className="prompt">The run went red. Pick the fix for the broken step.</p>
      <div className="script">
        {item.script.map((line, i) => (
          <div key={i} className={['line', i === item.brokenLine ? (fixedRight ? 'fixed' : 'broken') : ''].join(' ')}>
            <span className="line-n">{i + 1}</span><span className="mono">{locked && i === item.brokenLine && sel !== null ? item.fixes[sel] : line}</span>
            {i === item.brokenLine && (fixedRight ? <span className="line-ok">✓</span> : <span className="line-x">✗</span>)}
          </div>
        ))}
        <div className={`output mono ${fixedRight ? 'ok' : ''}`}>{fixedRight ? '✓ 5 passed' : locked ? `Still red. Correct fix: ${item.fixes[item.answer]}` : item.output}</div>
      </div>
      <div className="chips">
        {item.fixes.map((f, i) => (
          <motion.button key={i} whileTap={locked ? undefined : { scale: 0.95 }}
            className={['chip mono', sel === i ? 'on' : '', locked && i === item.answer ? 'reveal-pass' : '', locked && sel === i && i !== item.answer ? 'reveal-fail' : ''].join(' ')}
            onClick={() => { if (!locked) { sfx.select(); retry.clear(); setSel(i); } }}>{f}</motion.button>
        ))}
      </div>
      <Nudge text={retry.nudge} />
      {!locked && <RunButton disabled={sel === null} onClick={() => retry.submit(sel === item.answer, 'Still red. Read the error line under the script again, then try once more.')} label="Run again" />}
    </div>
  );
}

export function renderItem(props: ItemProps) {
  switch (props.item.kind) {
    case 'sort': return <SortItem {...props} />;
    case 'choice': return <ChoiceItem {...props} />;
    case 'order': return <OrderItem {...props} />;
    case 'locate': return <LocateItem {...props} />;
    case 'judge': return <JudgeItem {...props} />;
    case 'fix': return <FixItem {...props} />;
  }
}
