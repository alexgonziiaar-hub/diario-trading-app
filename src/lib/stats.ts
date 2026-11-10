import type { LiveTest, Progress, Trade } from '../data/types';
import { parseKey } from './format';

export function tradesInMonth(trades: Trade[], year: number, month: number): Trade[] {
  return trades.filter((t) => {
    const d = parseKey(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export interface Summary {
  total: number;
  count: number;
  winRate: number | null;
  profitFactor: number | null;
}

export function summarize(trades: Trade[]): Summary {
  const wins = trades.filter((t) => t.pnl > 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = -trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0);
  return {
    total: trades.reduce((s, t) => s + t.pnl, 0),
    count: trades.length,
    winRate: trades.length ? Math.round((wins.length / trades.length) * 100) : null,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : null
  };
}

export function formatPF(pf: number | null): string {
  if (pf === null) return '—';
  if (!Number.isFinite(pf)) return '∞';
  return pf.toFixed(2).replace('.', ',');
}

/** Resultado por día (clave YYYY-MM-DD) */
export function dailyTotals(trades: Trade[]): Record<string, number> {
  const out: Record<string, number> = {};
  trades.forEach((t) => {
    out[t.date] = (out[t.date] || 0) + t.pnl;
  });
  return out;
}

export const emptyProgress = (): Progress => ({ idx: 0, answers: {}, finished: false });

export type TestStatus = 'new' | 'progress' | 'done';

export interface TestState {
  status: TestStatus;
  answered: number;
  correct: number;
  total: number;
}

export function testState(test: LiveTest, p: Progress | undefined): TestState {
  const prog = p ?? emptyProgress();
  const answeredIdx = Object.keys(prog.answers).map(Number);
  const correct = answeredIdx.filter((i) => test.questions[i] && prog.answers[i] === test.questions[i].correct).length;
  const status: TestStatus = prog.finished ? 'done' : answeredIdx.length > 0 ? 'progress' : 'new';
  return { status, answered: answeredIdx.length, correct, total: test.questions.length };
}

/** Tests completados seguidos, empezando por el más reciente (el de hoy sin hacer no rompe la racha) */
export function testStreak(testsByDate: LiveTest[], progress: Record<string, Progress>): number {
  let n = 0;
  for (let i = 0; i < testsByDate.length; i++) {
    const done = progress[testsByDate[i].id]?.finished;
    if (done) n++;
    else if (i === 0) continue;
    else break;
  }
  return n;
}
