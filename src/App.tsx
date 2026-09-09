import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CONCEPTS, LADDER, PASS_SCORE } from './lib/content';
import { checkpointFor, clearBest, fmtTime, fresh, loadBest, loadBestScore, rankFor, reduce, saveBest, wonChocolate } from './lib/game';
import { isMuted, setMuted, sfx } from './lib/audio';
import { Timer } from './components/Timer';
import { LadderList, LadderRail } from './components/Ladder';
import { LifelineBar, QuestionCard } from './components/Question';

const enter = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.26, ease: [0.2, 0.8, 0.2, 1] } };

export default function App() {
  const [s, dispatch] = useReducer(reduce, undefined, fresh);
  const [muted, setMutedState] = useState(isMuted());
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [, setBestNonce] = useState(0);
  const stage = LADDER[s.stage];
  const playing = s.phase === 'question';
  const lastTick = useRef(0);
  useEffect(() => { document.body.classList.toggle('has-sheet', s.phase === 'reveal'); }, [s.phase]);

  // Countdown. Ticks 10x a second so the ring moves smoothly.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => dispatch({ type: 'tick', dt: 0.1 }), 100);
    return () => clearInterval(id);
  }, [playing, s.stage, s.drawn]);

  // Ticking sound in the final seconds.
  useEffect(() => {
    if (!playing) { lastTick.current = 0; return; }
    const whole = Math.ceil(s.timeLeft);
    if (whole !== lastTick.current && whole <= 5 && whole > 0) { lastTick.current = whole; sfx.tickUrgent(); }
  }, [s.timeLeft, playing]);

  // The KBC beat: after locking in, hold for a moment before the answer is shown.
  useEffect(() => {
    if (s.phase !== 'locking') return;
    sfx.suspense();
    const id = setTimeout(() => dispatch({ type: 'reveal' }), 1100);
    return () => clearTimeout(id);
  }, [s.phase]);

  // A dialog freezes the clock, and never lingers over a run that ended underneath it.
  useEffect(() => { dispatch({ type: 'pause', on: confirmRestart }); }, [confirmRestart]);
  useEffect(() => { if (s.phase !== 'question') setConfirmRestart(false); }, [s.phase]);

  // Sounds on reveal.
  useEffect(() => {
    if (s.phase === 'reveal') { s.lastCorrect ? sfx.pass() : sfx.fail(); }
    if (s.phase === 'stageclear') sfx.stageUp();
    if (s.phase === 'over') { s.won ? sfx.report() : sfx.gameOver(); saveBest(s.reached, s.score); }
  }, [s.phase]);

  // Keyboard: A–D to pick, Enter to lock or continue.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (confirmRestart) return;
      if (s.phase === 'question') {
        const i = ['a', 'b', 'c', 'd'].indexOf(k);
        if (i >= 0) { sfx.select(); dispatch({ type: 'select', i }); }
        if (k === 'enter' && s.selected !== null) { sfx.lock(); dispatch({ type: 'lock' }); }
      } else if (k === 'enter' && (s.phase === 'reveal' || s.phase === 'stageclear')) dispatch({ type: 'next' });
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [s.phase, s.selected, confirmRestart]);

  const toggleMute = () => { setMuted(!muted); setMutedState(!muted); };
  const inGame = s.phase !== 'intro' && s.phase !== 'over';

  return (
    <div className="app">
      <header className="top">
        {inGame ? <LadderRail stage={s.stage} cleared={s.reached} /> : <div className="brand">make it <b>green</b></div>}
        <div className="top-right">
          {inGame && <Timer left={s.timeLeft} total={stage.seconds} paused={s.phase !== 'question'} />}
          {s.phase !== 'intro' && <button className="icon restart" onClick={() => setConfirmRestart(true)} aria-label="Restart from the beginning">⟲<span>New player</span></button>}
          <button className="icon" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
        </div>
      </header>

      <main className="stage">
        <div className="stage-inner" key={`${s.phase}-${s.stage}-${s.drawn?.question.id ?? ''}`}>
          {s.phase === 'intro' && <motion.section {...enter}><Intro onStart={() => { sfx.stageUp(); dispatch({ type: 'start' }); }} onClearBest={() => { clearBest(); setBestNonce((n) => n + 1); }} /></motion.section>}

          {(s.phase === 'question' || s.phase === 'locking' || s.phase === 'reveal') && s.drawn && (
            <motion.section {...enter}>
              <div className="qhead">
                <span className="qstage mono"><i className={`tier ${stage.tier}`} />stage {stage.n} · {stage.name}</span>
                <span className={`tierpill ${stage.tier}`}>{stage.tier}</span>
              </div>
              <p className="qsub">{stage.sub} · worth {stage.points} points</p>
              <ChocolateBar score={s.score} slim />
              <div className="play-cols">
                <div className="play-main">
                  <QuestionCard drawn={s.drawn} selected={s.selected} hidden={s.hidden} poll={s.poll}
                    revealed={s.phase === 'reveal'} locking={s.phase === 'locking'} correctIndex={s.drawn.answer}
                    onSelect={(i) => dispatch({ type: 'select', i })} />
                  {s.phase === 'locking' && <p className="locking-note">🔒 Locked in. Let's see…</p>}
                  {s.phase === 'question' && (
                    <>
                      <LifelineBar lifelines={s.lifelines} disabled={false}
                        onBisect={() => dispatch({ type: 'bisect' })} onAsk={() => dispatch({ type: 'ask' })} onRerun={() => dispatch({ type: 'rerun' })} />
                      <button className="btn primary big lockbtn" disabled={s.selected === null} onClick={() => { sfx.lock(); dispatch({ type: 'lock' }); }}>
                        🔒 {s.selected === null ? 'Pick an answer' : 'Lock it in'}
                      </button>
                      <p className="fine">One answer. No second chance.</p>
                    </>
                  )}
                </div>
                <aside className="play-side"><LadderList cleared={s.reached} current={s.stage} compact /></aside>
              </div>
            </motion.section>
          )}

          {s.phase === 'stageclear' && <motion.section {...enter}><StageClear stage={s.stage} cleared={s.reached} score={s.score} gain={s.lastGain} onNext={() => dispatch({ type: 'next' })} /></motion.section>}
          {s.phase === 'over' && <motion.section {...enter}><Report s={s} onReplay={() => dispatch({ type: 'reset' })} /></motion.section>}
        </div>
      </main>

      <AnimatePresence>
        {s.justWonPrize && (
          <motion.div className="prize-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => dispatch({ type: 'prizeSeen' })}>
            <Confetti />
            <motion.div className="prize-burst" initial={{ scale: 0.5, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }}>
              <div className="prize-choc">🍫</div>
              <h2>That's a chocolate.</h2>
              <p>You passed {PASS_SCORE} points. Whatever happens next, it is yours.</p>
              <button className="btn primary big" onClick={() => dispatch({ type: 'prizeSeen' })}>Keep climbing</button>
            </motion.div>
          </motion.div>
        )}
        {confirmRestart && (
          <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmRestart(false)}>
            <motion.div className="modal-card" initial={{ scale: 0.9, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <h3>Restart from stage 1?</h3>
              <p>Your score of <b>{s.score}</b> and all progress will be lost. You will get a fresh set of questions.</p>
              <div className="two">
                <button className="btn primary big" onClick={() => { setConfirmRestart(false); sfx.lock(); dispatch({ type: 'reset' }); }}>⟲ Restart</button>
                <button className="btn big" autoFocus onClick={() => setConfirmRestart(false)}>Keep playing</button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {s.phase === 'reveal' && s.drawn && (
          <motion.div key={`rev-${s.stage}`} className={`sheet ${s.lastCorrect ? 'sheet-pass' : 'sheet-fail'}`}
            initial={{ y: 220, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 180, opacity: 0, transition: { duration: 0.16 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
            <div className="sheet-inner">
              <motion.div className="verdict" initial={{ scale: 0.7 }} animate={s.lastCorrect ? { scale: [0.7, 1.12, 1] } : { x: [0, -8, 8, -6, 6, 0], scale: 1 }} transition={{ duration: 0.45 }}>
                {s.lastCorrect ? '✓ Correct' : s.timedOut && s.selected === null ? "⏱ Time's up" : '✗ Wrong'}
              </motion.div>
              <p className="explain">{s.drawn.question.explain}</p>
              <button className="btn big on-pass" onClick={() => dispatch({ type: 'next' })}>
                {s.lastCorrect ? (s.stage + 1 >= LADDER.length ? 'Ship it 🚀' : `Promote to ${LADDER[s.stage + 1].name}`) : 'See the damage'} <span className="mono kbd">↵</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Intro({ onStart, onClearBest }: { onStart: () => void; onClearBest: () => void }) {
  const best = loadBest();
  return (
    <div className="intro">
      <div className="eyebrow mono">10 questions · one shot each · 5 minutes</div>
      <h1>Make it <span className="green">green</span>.</h1>
      <p className="lede">Answer to promote the build. Ten questions, harder every stage, a timer on every one. Get one wrong and the pipeline goes red.</p>
      <div className="intro-scale">
        <div className="scale-row"><b>50</b><span className="scale-bar"><i style={{ left: `${(PASS_SCORE / 4500) * 100}%` }} /></span><b>1200</b></div>
        <div className="scale-legend"><span>stage 1</span><span className="choc-mark">🍫 {PASS_SCORE}</span><span>stage 10</span></div>
      </div>
      <div className="intro-rules">
        <span>⏱ 30s → 20s</span><span>🔒 one answer only</span><span>🎲 random questions</span><span>✂ 3 lifelines</span>
      </div>
      <div className="prize">🍫 Score <b>{PASS_SCORE}</b> or more and you have earned a chocolate. Answer fast for bonus points.</div>
      {best > 0 && (
        <p className="fine left">Best on this device: stage {best} · {LADDER[best - 1].name} · ★ {loadBestScore()}
          {' '}<button className="linkbtn" onClick={onClearBest}>clear</button>
        </p>
      )}
      <button className="btn primary big" onClick={onStart}>▶ Start the pipeline</button>
      <p className="fine">No sign-up. Works on your phone. Sound on is nicer.</p>
    </div>
  );
}

function StageClear({ stage, cleared, score, gain, onNext }: { stage: number; cleared: number; score: number; gain: { base: number; bonus: number } | null; onNext: () => void }) {
  const st = LADDER[stage];
  const prev = LADDER[stage - 1];
  return (
    <div className="clear">
      <div className="eyebrow mono">build promoted</div>
      <h2>{prev.name} <span className="green">✓</span></h2>
      {gain && (
        <motion.div className="gain" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
          <span className="gain-base">+{gain.base}</span>
          {gain.bonus > 0 && <span className="gain-bonus">⚡ +{gain.bonus} fast answer</span>}
          <span className="gain-total">★ {score}</span>
        </motion.div>
      )}
      <ChocolateBar score={score} />
      {prev.checkpoint && <div className="cp-badge">⚑ Safe point reached — this score is yours even if the next question ends the run</div>}
      <LadderList cleared={cleared} current={stage} compact />
      <div className="sticky-cta">
        <button className="btn primary big" onClick={onNext}>Next: {st.name} · {st.points} pts <span className="mono kbd">↵</span></button>
      </div>
    </div>
  );
}

/** Progress toward the chocolate. The whole point of the score for a room full of people. */
function ChocolateBar({ score, big = false, slim = false }: { score: number; big?: boolean; slim?: boolean }) {
  const won = wonChocolate(score);
  const pct = Math.min(100, (score / PASS_SCORE) * 100);
  return (
    <div className={`choc ${won ? 'won' : ''} ${big ? 'big' : ''} ${slim ? 'slim' : ''}`}>
      <div className="choc-top">
        <span>★ {score} · 🍫 {won ? 'chocolate secured' : `${PASS_SCORE - score} more for a chocolate`}</span>
        {!slim && <span className="mono">{won ? 'target passed' : `${score} / ${PASS_SCORE}`}</span>}
      </div>
      <div className="choc-track"><motion.div className="choc-fill" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }} /></div>
    </div>
  );
}

function Report({ s, onReplay }: { s: ReturnType<typeof reduce>; onReplay: () => void }) {
  const cleared = s.reached;
  const rank = rankFor(cleared);
  const cp = checkpointFor(cleared);
  const time = fmtTime((s.finishedAt ?? Date.now()) - (s.startedAt ?? Date.now()));
  const right = s.answers.filter((a) => a.correct).length;
  const won = wonChocolate(s.score);
  const [copied, setCopied] = useState(false);
  const share = useMemo(() =>
    `🟢 Make It Green — ${s.won ? 'shipped to Production!' : `build failed at ${LADDER[Math.min(cleared, LADDER.length - 1)].name}`}\n` +
    `★ ${s.score} points · ${cleared}/10 stages · ${right} correct · ${time}\n` +
    `${won ? '🍫 Chocolate earned!' : `🍫 ${PASS_SCORE - s.score} points short of a chocolate`} · ${rank.name}\n` +
    LADDER.map((st) => `${st.n <= cleared ? '🟩' : '⬜️'}`).join('') +
    `\nPlay it (5 min): ${location.origin}${location.pathname}`, [cleared, right, time, rank, s.won]);
  const copy = async () => { try { await navigator.clipboard.writeText(share); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} };
  return (
    <div className="report">
      {s.won && <Confetti />}
      <div className="eyebrow mono">{s.won ? 'deployed' : 'build report'}</div>
      <h2 className="report-h">{s.won ? <>Shipped to <span className="green">production</span>.</> : <><span className="coral">Red</span> at {LADDER[Math.min(cleared, LADDER.length - 1)].name}.</>}</h2>
      <p className="report-sub">{s.won ? 'Ten questions, ten green stages. Nobody does that by accident.' : `You cleared ${cleared} of 10 stages${cp ? ` and banked the ${LADDER[cp - 1].name} checkpoint` : ''}. Different questions next run.`}</p>
      <div className={`scorebox ${won ? 'won' : ''}`}>
        <div className="eyebrow mono">final score</div>
        <div className="scorebig">★ {s.score}</div>
        {won
          ? <div className="prize-won">🍫 Chocolate earned — show this screen to claim it</div>
          : <div className="prize-miss">🍫 {PASS_SCORE - s.score} points short. One more run?</div>}
      </div>
      {!won && <ChocolateBar score={s.score} big />}
      <div className="summary">
        <div className="stat"><b className="green">{cleared}/10</b><span>stages</span></div>
        <div className="stat"><b>{right}</b><span>correct</span></div>
        <div className="stat"><b>{time}</b><span>time</span></div>
      </div>
      <LadderList cleared={cleared} compact />
      <div className="rank"><div className="eyebrow mono">your rank</div><b>{rank.name}</b><p>{rank.line}</p></div>
      <div className="learned">
        <div className="eyebrow mono">ideas you got right</div>
        <div className="chips static">{CONCEPTS.map((c) => {
          const asked = s.answers.some((a) => a.concept === c);
          const got = s.answers.some((a) => a.concept === c && a.correct);
          return <span key={c} className={`chip ${got ? 'got' : asked ? 'miss' : ''}`}>{got ? '✓ ' : ''}{c}</span>;
        })}</div>
        <p className="fine left">Faded ideas did not come up this run. A new run draws different questions.</p>
      </div>
      <div className="two">
        <button className="btn primary big" onClick={onReplay}>⟲ Restart</button>
        <button className="btn big" onClick={copy}>{copied ? '✓ Copied' : 'Copy result'}</button>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 44 }, (_, i) => ({ i, x: Math.random() * 100, d: 1.6 + Math.random() * 1.4, r: Math.random() * 360, c: ['#19C37D', '#FFD23F', '#4F6BFF', '#FF5A5F', '#B36BFF'][i % 5], s: 6 + Math.random() * 8, delay: Math.random() * 0.6 })), []);
  return <div className="confetti" aria-hidden>{pieces.map((p) => <span key={p.i} style={{ left: `${p.x}%`, background: p.c, width: p.s, height: p.s * 0.6, animationDuration: `${p.d}s`, animationDelay: `${p.delay}s`, transform: `rotate(${p.r}deg)` }} />)}</div>;
}
