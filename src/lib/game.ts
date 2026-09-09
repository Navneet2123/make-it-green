import { LADDER, RANKS, draw, type Drawn } from './content';

export type Phase = 'intro' | 'question' | 'reveal' | 'stageclear' | 'over';

export interface Lifelines { bisect: boolean; ask: boolean; rerun: boolean }

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
  lastCorrect: boolean | null;
  timedOut: boolean;
  reached: number;          // stages cleared
  answers: { concept: string; correct: boolean }[];
  startedAt: number | null;
  finishedAt: number | null;
  won: boolean;
}

export const fresh = (): State => ({
  phase: 'intro', stage: 0, drawn: null, used: new Set(), selected: null, timeLeft: LADDER[0].seconds,
  lifelines: { bisect: true, ask: true, rerun: true }, hidden: [], poll: null,
  lastCorrect: null, timedOut: false, reached: 0, answers: [], startedAt: null, finishedAt: null, won: false,
});

export type Action =
  | { type: 'start' } | { type: 'select'; i: number } | { type: 'lock' } | { type: 'tick'; dt: number }
  | { type: 'next' } | { type: 'bisect' } | { type: 'ask' } | { type: 'rerun' } | { type: 'reset' };

/** Where you fall back to when a run ends: the last checkpoint you cleared. */
export function checkpointFor(cleared: number) {
  let cp = 0;
  for (const s of LADDER) if (s.checkpoint && s.n <= cleared) cp = s.n;
  return cp;
}

export function reduce(s: State, a: Action): State {
  switch (a.type) {
    case 'start': {
      const drawn = draw(LADDER[0].tier, new Set());
      return { ...fresh(), phase: 'question', drawn, used: new Set([drawn.question.id]), timeLeft: LADDER[0].seconds, startedAt: Date.now() };
    }
    case 'select':
      if (s.phase !== 'question' || s.hidden.includes(a.i)) return s;
      return { ...s, selected: a.i };
    case 'tick': {
      if (s.phase !== 'question') return s;
      const t = s.timeLeft - a.dt;
      if (t > 0) return { ...s, timeLeft: t };
      // out of time: a selected-but-unlocked answer still counts, otherwise it is a miss
      return settle(s, s.selected, true);
    }
    case 'lock':
      if (s.phase !== 'question' || s.selected === null) return s;
      return settle(s, s.selected, false);
    case 'next': {
      if (s.phase === 'reveal' && s.lastCorrect) {
        const nextStage = s.stage + 1;
        if (nextStage >= LADDER.length) return { ...s, phase: 'over', won: true, finishedAt: Date.now() };
        return { ...s, phase: 'stageclear', stage: nextStage };
      }
      if (s.phase === 'stageclear') {
        const st = LADDER[s.stage];
        const drawn = draw(st.tier, s.used);
        return { ...s, phase: 'question', drawn, used: new Set([...s.used, drawn.question.id]), selected: null, hidden: [], poll: null, timeLeft: st.seconds, timedOut: false };
      }
      return { ...s, phase: 'over', finishedAt: Date.now() };
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
      const drawn = draw(st.tier, s.used);
      return { ...s, drawn, used: new Set([...s.used, drawn.question.id]), selected: null, hidden: [], poll: null, timeLeft: st.seconds, lifelines: { ...s.lifelines, rerun: false } };
    }
    case 'reset': return fresh();
  }
}

function settle(s: State, choice: number | null, timedOut: boolean): State {
  const correct = choice !== null && choice === s.drawn!.answer;
  return {
    ...s, phase: 'reveal', selected: choice, lastCorrect: correct, timedOut, timeLeft: 0,
    reached: correct ? s.stage + 1 : s.reached,
    answers: [...s.answers, { concept: s.drawn!.question.concept, correct }],
  };
}

export const rankFor = (cleared: number) => [...RANKS].reverse().find((r) => cleared >= r.min)!;
export const fmtTime = (ms: number) => { const t = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

const BEST_KEY = 'mig-best-stage';
export const loadBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
export const saveBest = (n: number) => { try { if (n > loadBest()) localStorage.setItem(BEST_KEY, String(n)); } catch {} };
