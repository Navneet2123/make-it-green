import { useEffect, useMemo, useReducer, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LEVELS, RANKS, TOTAL_TESTS } from './lib/content';
import { fmtTime, initial, passedCount, reduce, type GameState } from './lib/game';
import { isMuted, setMuted, sfx } from './lib/audio';
import { RunStrip } from './components/RunStrip';
import { renderItem } from './components/Items';

const slide = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] } };

const screenKey = (sc: { t: string; li?: number; ii?: number }) => sc.t === 'feedback' ? `play-${sc.li}-${sc.ii}` : `${sc.t}-${sc.li ?? ''}-${sc.ii ?? ''}`;

export default function App() {
  const [s, dispatch] = useReducer(reduce, initial, (init): GameState => {
    try { const raw = sessionStorage.getItem('mig-run'); if (raw) { const st = JSON.parse(raw) as GameState; if (st.screen.t === 'feedback') st.screen = { t: 'play', li: st.screen.li, ii: st.screen.ii }; return st; } } catch {}
    return init;
  });
  useEffect(() => { try { sessionStorage.setItem('mig-run', JSON.stringify(s)); } catch {} }, [s]);
  const [muted, setMutedState] = useState(isMuted());
  const toggleMute = () => { setMuted(!muted); setMutedState(!muted); };
  const inRun = s.screen.t !== 'intro' && s.screen.t !== 'report';
  useEffect(() => { document.body.classList.toggle('has-sheet', s.screen.t === 'feedback'); }, [s.screen.t]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Enter' && s.screen.t === 'feedback') dispatch({ type: 'continue' }); if (e.key === 'Enter' && s.screen.t === 'level') dispatch({ type: 'beginLevel' }); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [s.screen.t]);

  return (
    <div className="app">
      <header className="top">
        {inRun ? <RunStrip results={s.results} screen={s.screen} /> : <div className="brand">make it <b>green</b></div>}
        <div className="top-right">
          {inRun && <span className="xp" aria-label="XP">⚡ {s.xp}</span>}
          <button className="icon" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
        </div>
      </header>
      <main className="stage">
        <div className="stage-inner" key={screenKey(s.screen)}>
          {s.screen.t === 'intro' && <motion.section key="intro" {...slide}><Intro onStart={() => { sfx.level(); dispatch({ type: 'start' }); }} /></motion.section>}
          {s.screen.t === 'level' && <motion.section key={`level-${s.screen.li}`} {...slide}><LevelIntro li={s.screen.li} onBegin={() => { sfx.tap(); dispatch({ type: 'beginLevel' }); }} /></motion.section>}
          {(s.screen.t === 'play' || s.screen.t === 'feedback') && (
            <motion.section key={`play-${s.screen.li}-${s.screen.ii}`} {...slide}>
              <Play li={s.screen.li} ii={s.screen.ii} locked={s.screen.t === 'feedback'} streak={s.streak}
                onSubmit={(pass, retried) => { pass ? sfx.pass() : sfx.fail(); dispatch({ type: 'answer', pass, retried }); }} />
            </motion.section>
          )}
          {s.screen.t === 'report' && <motion.section key="report" {...slide}><Report state={s} onReplay={() => dispatch({ type: 'reset' })} /></motion.section>}
        </div>
      </main>
      <AnimatePresence>
        {s.screen.t === 'feedback' && (
          <Feedback key={`fb-${s.screen.li}-${s.screen.ii}`} li={s.screen.li} ii={s.screen.ii} pass={s.screen.pass} streak={s.streak} last={s.screen.li === LEVELS.length - 1 && s.screen.ii === LEVELS[s.screen.li].items.length - 1}
            onContinue={() => { sfx.tap(); dispatch({ type: 'continue' }); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="intro">
      <div className="eyebrow mono">a 5-minute game about test automation</div>
      <h1>Make it <span className="green">green</span>.</h1>
      <p className="lede">Five tiny levels. Five minutes. You'll walk away knowing what test automation actually is.</p>
      <ul className="intro-levels">
        {LEVELS.map((l, i) => (
          <li key={l.id}><span className="lvl-n mono">{i + 1}</span><span className="lvl-name">{l.title}</span><span className="lvl-concept" style={{ color: l.color }}>{l.items.length} tests</span></li>
        ))}
      </ul>
      <p className="fine left">Every answer is a test. Make all {TOTAL_TESTS} of them go green.</p>
      <button className="btn primary big" onClick={onStart}>▶ Start</button>
      <p className="fine">No sign-up. Works on your phone. Sound on is nicer.</p>
    </div>
  );
}

function LevelIntro({ li, onBegin }: { li: number; onBegin: () => void }) {
  const l = LEVELS[li];
  return (
    <div className="level-intro">
      <div className="eyebrow mono">level {li + 1} of {LEVELS.length} · {l.items.length} tests</div>
      <h2><span className="swatch" style={{ background: l.color }} />{l.title}</h2>
      <div className="file mono">{l.file}</div>
      <p className="story">{l.story}</p>
      <div className="concept-pill">You'll learn: <b>{l.concept}</b></div>
      <button className="btn primary big" onClick={onBegin}>Begin</button>
    </div>
  );
}

function Play({ li, ii, locked, streak, onSubmit }: { li: number; ii: number; locked: boolean; streak: number; onSubmit: (p: boolean, retried: boolean) => void }) {
  const l = LEVELS[li];
  const item = l.items[ii];
  return (
    <div className="play">
      <div className="play-head">
        <span className="file mono"><i style={{ background: l.color }} />{l.file}</span>
        <span className="mono muted">test {ii + 1}/{l.items.length}</span>
        {streak >= 2 && !locked && <span className="streak">🔥 {streak} in a row</span>}
      </div>
      {renderItem({ item, locked, onSubmit })}
    </div>
  );
}

function Feedback({ li, ii, pass, streak, last, onContinue }: { li: number; ii: number; pass: boolean; streak: number; last: boolean; onContinue: () => void }) {
  const item = LEVELS[li].items[ii];
  return (
    <motion.div className={`sheet ${pass ? 'sheet-pass' : 'sheet-fail'}`} initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 160, opacity: 0, transition: { duration: 0.16 } }} transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
      <div className="sheet-inner">
        <motion.div className="verdict" initial={{ scale: 0.6 }} animate={pass ? { scale: [0.6, 1.15, 1] } : { x: [0, -8, 8, -6, 6, 0], scale: 1 }} transition={{ duration: 0.45 }}>
          {pass ? '✓ You got it' : '✗ Not quite'}
        </motion.div>
        {pass && streak >= 3 && <div className="bonus">🔥 +5 streak bonus</div>}
        <p className="explain">{item.explain}</p>
        <button className={`btn big ${pass ? 'on-pass' : 'on-fail'}`} onClick={onContinue} autoFocus>{last ? 'See my report' : 'Continue'} <span className="mono kbd">↵</span></button>
      </div>
    </motion.div>
  );
}

function Report({ state, onReplay }: { state: ReturnType<typeof reduce>; onReplay: () => void }) {
  const passed = passedCount(state.results);
  const ratio = passed / TOTAL_TESTS;
  const rank = [...RANKS].reverse().find((r) => ratio >= r.min)!;
  const time = fmtTime((state.finishedAt ?? Date.now()) - (state.startedAt ?? Date.now()));
  const [copied, setCopied] = useState(false);
  useEffect(() => { sfx.report(); }, []);
  const perLevel = LEVELS.map((l, li) => ({ l, ok: l.items.filter((_, ii) => state.results[`${li}-${ii}`]).length }));
  const share = useMemo(() => `🟢 Make It Green — ${passed}/${TOTAL_TESTS} tests green in ${time} · ${rank.name}\n` + perLevel.map((p) => `${p.ok === p.l.items.length ? '✓' : p.ok === 0 ? '✗' : '◐'} ${p.l.file} ${p.ok}/${p.l.items.length}`).join('\n') + `\nPlay it (5 min): ${location.origin}${location.pathname}`, [passed, time, rank, perLevel]);
  const copy = async () => { try { await navigator.clipboard.writeText(share); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} };
  return (
    <div className="report">
      {ratio >= 0.8 && <Confetti />}
      <div className="eyebrow mono">test report</div>
      <h2 className="report-h"><span className="green">{passed}</span><span className="of"> of {TOTAL_TESTS}</span> green.</h2>
      <p className="report-sub">{passed === TOTAL_TESTS ? 'A perfect first run. Sam would hire you.' : passed >= TOTAL_TESTS * 0.8 ? 'A strong run. The red ones are the lessons you will remember.' : 'Red is not a bad grade. It is where the learning happened.'}</p>
      <div className="summary">
        <div className="stat"><b className="green">{passed}</b><span>passed</span></div>
        <div className="stat"><b className={TOTAL_TESTS - passed ? 'coral' : ''}>{TOTAL_TESTS - passed}</b><span>failed</span></div>
        <div className="stat"><b>{time}</b><span>time</span></div>
        <div className="stat"><b>⚡{state.xp}</b><span>xp</span></div>
      </div>
      <ul className="files mono">
        {perLevel.map(({ l, ok }) => (
          <li key={l.id} className={ok === l.items.length ? 'ok' : ok === 0 ? 'bad' : 'part'}><span>{ok === l.items.length ? '✓' : ok === 0 ? '✗' : '◐'}</span><span className="fname">{l.file}</span><span>{ok}/{l.items.length}</span></li>
        ))}
      </ul>
      <div className="rank"><div className="eyebrow mono">your rank</div><b>{rank.name}</b><p>{rank.line}</p></div>
      <div className="learned">
        <div className="eyebrow mono">now you know</div>
        <div className="chips static">{LEVELS.map((l) => <span key={l.id} className="chip" style={{ borderColor: l.color }}>{l.concept}</span>)}</div>
      </div>
      <div className="two">
        <button className="btn primary big" onClick={onReplay}>↻ Run again</button>
        <button className="btn big" onClick={copy}>{copied ? '✓ Copied' : 'Copy result'}</button>
      </div>
      {state.bestStreak >= 5 && <p className="fine">Best streak: {state.bestStreak} in a row.</p>}
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 44 }, (_, i) => ({ i, x: Math.random() * 100, d: 1.6 + Math.random() * 1.4, r: Math.random() * 360, c: ['#19C37D', '#FFD23F', '#4F6BFF', '#FF5A5F', '#B36BFF'][i % 5], s: 6 + Math.random() * 8, delay: Math.random() * 0.6 })), []);
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => <span key={p.i} style={{ left: `${p.x}%`, background: p.c, width: p.s, height: p.s * 0.6, animationDuration: `${p.d}s`, animationDelay: `${p.delay}s`, transform: `rotate(${p.r}deg)` }} />)}
    </div>
  );
}
