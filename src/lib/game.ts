import { LEVELS } from './content';

export type Screen =
  | { t: 'intro' }
  | { t: 'level'; li: number }
  | { t: 'play'; li: number; ii: number }
  | { t: 'feedback'; li: number; ii: number; pass: boolean }
  | { t: 'report' };

export interface GameState {
  screen: Screen;
  results: Record<string, boolean>;
  streak: number;
  bestStreak: number;
  xp: number;
  startedAt: number | null;
  finishedAt: number | null;
}

export const initial: GameState = { screen: { t: 'intro' }, results: {}, streak: 0, bestStreak: 0, xp: 0, startedAt: null, finishedAt: null };

export type Action = { type: 'start' } | { type: 'beginLevel' } | { type: 'answer'; pass: boolean; retried?: boolean } | { type: 'continue' } | { type: 'reset' };

export function reduce(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'start': return { ...initial, screen: { t: 'level', li: 0 }, startedAt: Date.now() };
    case 'beginLevel': { if (s.screen.t !== 'level') return s; return { ...s, screen: { t: 'play', li: s.screen.li, ii: 0 } }; }
    case 'answer': {
      if (s.screen.t !== 'play') return s;
      const { li, ii } = s.screen;
      const streak = a.pass && !a.retried ? s.streak + 1 : 0;
      const gained = a.pass ? (a.retried ? 5 : 10 + (streak >= 3 ? 5 : 0)) : 0;
      return { ...s, results: { ...s.results, [`${li}-${ii}`]: a.pass }, streak, bestStreak: Math.max(s.bestStreak, streak), xp: s.xp + gained, screen: { t: 'feedback', li, ii, pass: a.pass } };
    }
    case 'continue': {
      if (s.screen.t !== 'feedback') return s;
      const { li, ii } = s.screen;
      if (ii + 1 < LEVELS[li].items.length) return { ...s, screen: { t: 'play', li, ii: ii + 1 } };
      if (li + 1 < LEVELS.length) return { ...s, screen: { t: 'level', li: li + 1 } };
      return { ...s, screen: { t: 'report' }, finishedAt: Date.now() };
    }
    case 'reset': return initial;
  }
}

export const passedCount = (r: Record<string, boolean>) => Object.values(r).filter(Boolean).length;
export const fmtTime = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
