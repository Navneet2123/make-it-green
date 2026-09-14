import { LADDER, PASS_SCORE, RANKS, SPEED_BONUS, draw, rememberSeen, type Drawn } from './content';

export type Phase = 'intro' | 'question' | 'locking' | 'over';

export interface Lifelines { bisect: boolean; ask: boolean; rerun: boolean }

/** Everything needed to explain one question, saved for the report at the end. */
export interface AnswerRecord {
  stage: number;
  stageName: string;
  question: string;
  chosen: string | null;     // null when the clock ran out
  correctText: string;
  correct: boolean;
  explain: string;
  concept: string;
  points: number;
}

export interface State {
  phase: Phase;
  stage: number;            // 0-based index into LADDER
  drawn: Drawn | null;
  used: Set<string>;
  selected: number | null;  // index into the shuffled option order
  timeLeft: number;
  lifelines: Lifelines;
  hidden: number[];         // options removed by Bisect
  poll: number[] | null;    // Ask the team percentages
  timedOut: boolean;
  reached: number;          // questions answered correctly
  score: number;            // points earned so far
  lastGain: { base: number; bonus: number } | null;
  paused: boolean;          // a dialog is open, so the clock stops
  justWonPrize: boolean;    // this answer is the one that crossed the chocolate line
  answers: AnswerRecord[];
  startedAt: number | null;
  finishedAt: number | null;
  won: boolean;
}

export const fresh = (): State => ({
  phase: 'intro', stage: 0, drawn: null, used: new Set(), selected: null, timeLeft: LADDER[0].seconds,
  lifelines: { bisect: true, ask: true, rerun: true }, hidden: [], poll: null,
  timedOut: false, reached: 0, score: 0, lastGain: null, paused: false, justWonPrize: false,
  answers: [], startedAt: null, finishedAt: null, won: false,
});

export type Action =
  | { type: 'start' } | { type: 'select'; i: number } | { type: 'lock' } | { type: 'advance' } | { type: 'tick'; dt: number }
  | { type: 'bisect' } | { type: 'ask' } | { type: 'rerun' } | { type: 'reset' }
  | { type: 'pause'; on: boolean } | { type: 'prizeSeen' };

export function reduce(s: State, a: Action): State {
  switch (a.type) {
    case 'start': {
      const drawn = draw(LADDER[0].tier, new Set(), 1);
      return { ...fresh(), phase: 'question', drawn, used: new Set([drawn.question.id]), timeLeft: LADDER[0].seconds, startedAt: Date.now() };
    }
    case 'select':
      if (s.phase !== 'question' || s.hidden.includes(a.i)) return s;
      return { ...s, selected: a.i };
    case 'pause': return { ...s, paused: a.on };
    case 'prizeSeen': return { ...s, justWonPrize: false };
    case 'tick': {
      if (s.phase !== 'question' || s.paused) return s;
      const t = s.timeLeft - a.dt;
      if (t > 0) return { ...s, timeLeft: t };
      // out of time: a selected-but-unlocked answer still counts, otherwise it is a miss
      return { ...s, phase: 'locking', timedOut: true, timeLeft: 0 };
    }
    case 'lock':
      if (s.phase !== 'question' || s.selected === null) return s;
      return { ...s, phase: 'locking', timedOut: false };   // brief beat, then straight on
    case 'advance': {
      if (s.phase !== 'locking') return s;
      const recorded = settle(s, s.timedOut ? s.selected : s.selected, s.timedOut);
      const nextStage = recorded.stage + 1;
      if (nextStage >= LADDER.length) {
        rememberSeen([...recorded.used]);
        return { ...recorded, phase: 'over', won: recorded.reached === LADDER.length, finishedAt: Date.now() };
      }
      const st = LADDER[nextStage];
      const drawn = draw(st.tier, recorded.used, st.n);
      return {
        ...recorded, phase: 'question', stage: nextStage, drawn, used: new Set([...recorded.used, drawn.question.id]),
        selected: null, hidden: [], poll: null, timeLeft: st.seconds, timedOut: false,
      };
    }
    case 'bisect': {
      if (s.phase !== 'question' || !s.lifelines.bisect || !s.drawn) return s;
      const wrong = [0, 1, 2, 3].filter((i) => i !== s.drawn!.answer);
      const hidden = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
      const selected = s.selected !== null && hidden.includes(s.selected) ? null : s.selected;
      return { ...s, hidden, selected, lifelines: { ...s.lifelines, bisect: false } };
    }
    case 'ask': {
      if (s.phase !== 'question' || !s.lifelines.ask || !s.drawn) return s;
      // The team is usually right, but not always — and never on the options Bisect removed.
      const live = [0, 1, 2, 3].filter((i) => !s.hidden.includes(i));
      const confident = Math.random() < 0.82;
      const weights = live.map((i) => (i === s.drawn!.answer ? (confident ? 55 + Math.random() * 25 : 18 + Math.random() * 10) : 5 + Math.random() * 20));
      const total = weights.reduce((x, y) => x + y, 0);
      const poll = [0, 1, 2, 3].map((i) => { const k = live.indexOf(i); return k === -1 ? 0 : Math.round((weights[k] / total) * 100); });
      return { ...s, poll, lifelines: { ...s.lifelines, ask: false } };
    }
    case 'rerun': {
      if (s.phase !== 'question' || !s.lifelines.rerun) return s;
      const st = LADDER[s.stage];
      const drawn = draw(st.tier, s.used, st.n);
      return { ...s, drawn, used: new Set([...s.used, drawn.question.id]), selected: null, hidden: [], poll: null, timeLeft: st.seconds, lifelines: { ...s.lifelines, rerun: false } };
    }
    case 'reset': return fresh();
  }
}

function settle(s: State, choice: number | null, timedOut: boolean): State {
  const d = s.drawn!;
  const correct = choice !== null && choice === d.answer;
  const st = LADDER[s.stage];
  const base = correct ? st.points : 0;
  const bonus = correct ? Math.round(st.points * SPEED_BONUS * Math.max(0, s.timeLeft) / st.seconds) : 0;
  const record: AnswerRecord = {
    stage: st.n,
    stageName: st.name,
    question: d.question.q,
    chosen: choice === null ? null : d.question.options[d.order[choice]],
    correctText: d.question.options[d.question.answer],
    correct,
    explain: d.question.explain,
    concept: d.question.concept,
    points: base + bonus,
  };
  return {
    ...s,
    reached: correct ? s.reached + 1 : s.reached,
    score: s.score + base + bonus,
    lastGain: correct ? { base, bonus } : null,
    answers: [...s.answers, record],
    timedOut,
  };
}

export const wonChocolate = (score: number) => score >= PASS_SCORE;

export const rankFor = (cleared: number) => [...RANKS].reverse().find((r) => cleared >= r.min)!;
export const fmtTime = (ms: number) => { const t = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

const BEST_KEY = 'mig-best-stage';
const BEST_SCORE_KEY = 'mig-best-score';
export const loadBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
export const loadBestScore = () => { try { return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0; } catch { return 0; } };
export const clearBest = () => { try { localStorage.removeItem(BEST_KEY); localStorage.removeItem(BEST_SCORE_KEY); } catch {} };
export const saveBest = (n: number, score: number) => {
  try {
    if (n > loadBest()) localStorage.setItem(BEST_KEY, String(n));
    if (score > loadBestScore()) localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {}
};
