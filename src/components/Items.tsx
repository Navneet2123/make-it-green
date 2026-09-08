import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Item } from '../lib/content';
import { sfx } from '../lib/audio';

export interface ItemProps { item: Item; locked: boolean; onSubmit: (pass: boolean) => void }

const shuffle = <T,>(arr: T[], seed: number) => { const a = [...arr]; let s = seed; for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function RunButton({ disabled, onClick, label = 'Run test' }: { disabled?: boolean; onClick: () => void; label?: string }) {
  return <button className="btn primary big" disabled={disabled} onClick={onClick}>▶ {label}</button>;
}

/* ---------- Level 1: sort ---------- */
export function SortItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'sort') return null;
  const [picked, setPicked] = useState<boolean[]>(() => item.cards.map(() => false));
  const toggle = (i: number) => { if (locked) return; sfx.select(); setPicked((p) => p.map((v, j) => (j === i ? !v : v))); };
  const submit = () => onSubmit(item.cards.every((c, i) => c.robot === picked[i]));
  return (
    <div className="item">
      <p className="prompt">{item.prompt}</p>
      <p className="hint">{item.hint}</p>
      <div className="stack">
        {item.cards.map((c, i) => {
          const state = locked ? (c.robot ? 'right' : 'wrong-if-picked') : '';
          const cls = ['pick', picked[i] ? 'on' : '', locked && c.robot ? 'reveal-pass' : '', locked && !c.robot && picked[i] ? 'reveal-fail' : ''].join(' ');
          void state;
          return (
            <motion.button key={i} whileTap={locked ? undefined : { scale: 0.97 }} className={cls} onClick={() => toggle(i)} aria-pressed={picked[i]}>
              <span className="pick-badge">{picked[i] ? '🤖' : '🧑'}</span>
              <span>{c.text}</span>
              <span className="pick-tag">{picked[i] ? 'Robot' : 'Human'}</span>
            </motion.button>
          );
        })}
      </div>
      {!locked && <RunButton disabled={!picked.some(Boolean)} onClick={submit} />}
    </div>
  );
}

/* ---------- choice ---------- */
export function ChoiceItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'choice') return null;
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="item">
      <p className="prompt">{item.prompt}</p>
      <div className="stack">
        {item.options.map((o, i) => (
          <motion.button key={i} whileTap={locked ? undefined : { scale: 0.97 }}
            className={['pick', sel === i ? 'on' : '', locked && i === item.answer ? 'reveal-pass' : '', locked && sel === i && i !== item.answer ? 'reveal-fail' : ''].join(' ')}
            onClick={() => { if (!locked) { sfx.select(); setSel(i); } }}>
            <span className="pick-badge mono">{String.fromCharCode(65 + i)}</span><span>{o}</span>
          </motion.button>
        ))}
      </div>
      {!locked && <RunButton disabled={sel === null} onClick={() => onSubmit(sel === item.answer)} />}
    </div>
  );
}

/* ---------- Level 2: order ---------- */
export function OrderItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'order') return null;
  const pool = useMemo(() => shuffle(item.steps.map((_, i) => i), item.steps.length * 7 + 3), [item]);
  const [seq, setSeq] = useState<number[]>([]);
  const add = (i: number) => { if (locked) return; sfx.select(); setSeq((s) => [...s, i]); };
  const remove = (pos: number) => { if (locked) return; sfx.tap(); setSeq((s) => s.filter((_, j) => j !== pos)); };
  const check = () => {
    const groups = item.interchangeable ?? [];
    const ok = seq.length === item.steps.length && seq.every((stepIdx, pos) => {
      if (stepIdx === pos) return true;
      const g = groups.find((gr) => gr.includes(pos));
      return !!g && g.includes(stepIdx) && g.every((p) => g.includes(seq[p]));
    });
    onSubmit(ok);
  };
  const correctAt = (pos: number) => { const g = (item.interchangeable ?? []).find((gr) => gr.includes(pos)); return seq[pos] === pos || (!!g && g.includes(seq[pos]) && g.every((p) => g.includes(seq[p]))); };
  return (
    <div className="item">
      <p className="prompt">{item.prompt}</p>
      <ol className="seq">
        {item.steps.map((_, pos) => (
          <li key={pos} className={['slot', seq[pos] !== undefined ? 'filled' : '', locked && seq[pos] !== undefined ? (correctAt(pos) ? 'reveal-pass' : 'reveal-fail') : ''].join(' ')} onClick={() => seq[pos] !== undefined && remove(pos)}>
            <span className="slot-n">{pos + 1}</span>
            <span className="mono">{seq[pos] !== undefined ? item.steps[seq[pos]] : locked ? item.steps[pos] : '—'}</span>
          </li>
        ))}
      </ol>
      {!locked && (
        <div className="chips">
          {pool.filter((i) => !seq.includes(i)).map((i) => (
            <motion.button key={i} layout whileTap={{ scale: 0.95 }} className="chip mono" onClick={() => add(i)}>{item.steps[i]}</motion.button>
          ))}
        </div>
      )}
      {locked && <p className="hint">Correct order shown in green.</p>}
      {!locked && <RunButton disabled={seq.length !== item.steps.length} onClick={check} />}
    </div>
  );
}

/* ---------- Level 3: locate on a mini page ---------- */
const ELEMENTS: { id: string; tag: string; render: (sel: boolean) => JSX.Element }[] = [
  { id: 'email', tag: '<input id="email" name="email">', render: () => <div className="mini-input">you@example.com</div> },
  { id: 'password', tag: '<input id="password" name="password" type="password">', render: () => <div className="mini-input">••••••••</div> },
  { id: 'login', tag: '<button id="login">Log in</button>', render: () => <div className="mini-btn">Log in</div> },
  { id: 'forgot', tag: '<a class="ghost">Forgot password?</a>', render: () => <div className="mini-link muted">Forgot password?</div> },
  { id: 'signup', tag: '<a id="signup">Sign up</a>', render: () => <div className="mini-link">Sign up</div> },
];
export function LocateItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'locate') return null;
  const [sel, setSel] = useState<string | null>(null);
  const selected = ELEMENTS.find((e) => e.id === sel);
  return (
    <div className="item">
      <p className="prompt">{item.prompt}</p>
      <div className="locator mono">{item.locator}</div>
      <div className="mini">
        <div className="mini-bar"><span /><span /><span /><em>myapp.test/login</em></div>
        <div className="mini-body">
          <div className="mini-title">MyApp</div>
          {ELEMENTS.map((e) => (
            <button key={e.id} className={['mini-el', sel === e.id ? 'on' : '', locked && e.id === item.target ? 'reveal-pass' : '', locked && sel === e.id && e.id !== item.target ? 'reveal-fail' : ''].join(' ')}
              onClick={() => { if (!locked) { sfx.select(); setSel(e.id); } }} aria-label={e.tag}>
              {e.render(sel === e.id)}
            </button>
          ))}
        </div>
        <div className="inspector mono">{selected ? selected.tag : 'Tap an element to inspect its tag'}</div>
      </div>
      {!locked && <RunButton disabled={!sel} onClick={() => onSubmit(sel === item.target)} />}
    </div>
  );
}

/* ---------- Level 4: judge ---------- */
export function JudgeItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'judge') return null;
  return (
    <div className="item">
      <p className="prompt">Does this assertion pass?</p>
      <div className="judge">
        <div className="judge-row"><span className="judge-k">expected</span><span className="judge-v mono">{item.expected}</span></div>
        <div className="judge-eq">=?</div>
        <div className="judge-row"><span className="judge-k">actual</span><span className="judge-v mono">{item.actual}</span></div>
      </div>
      {!locked && (
        <div className="two">
          <button className="btn pass big" onClick={() => onSubmit(item.pass === true)}>✓ PASS</button>
          <button className="btn fail big" onClick={() => onSubmit(item.pass === false)}>✗ FAIL</button>
        </div>
      )}
      {locked && <p className="hint">Correct answer: <b className={item.pass ? 'c-pass' : 'c-fail'}>{item.pass ? 'PASS' : 'FAIL'}</b></p>}
    </div>
  );
}

/* ---------- Level 5: fix ---------- */
export function FixItem({ item, locked, onSubmit }: ItemProps) {
  if (item.kind !== 'fix') return null;
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="item">
      <p className="prompt">The run went red. Pick the fix for the broken step.</p>
      <div className="script">
        {item.script.map((line, i) => (
          <div key={i} className={['line', i === item.brokenLine ? 'broken' : ''].join(' ')}>
            <span className="line-n">{i + 1}</span><span className="mono">{locked && i === item.brokenLine ? item.fixes[item.answer] : line}</span>
            {i === item.brokenLine && !locked && <span className="line-x">✗</span>}
            {i === item.brokenLine && locked && <span className="line-ok">✓</span>}
          </div>
        ))}
        <div className="output mono">{locked ? '✓ 5 passed' : item.output}</div>
      </div>
      <div className="chips">
        {item.fixes.map((f, i) => (
          <motion.button key={i} whileTap={locked ? undefined : { scale: 0.95 }}
            className={['chip mono', sel === i ? 'on' : '', locked && i === item.answer ? 'reveal-pass' : '', locked && sel === i && i !== item.answer ? 'reveal-fail' : ''].join(' ')}
            onClick={() => { if (!locked) { sfx.select(); setSel(i); } }}>{f}</motion.button>
        ))}
      </div>
      {!locked && <RunButton disabled={sel === null} onClick={() => onSubmit(sel === item.answer)} label="Run again" />}
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
