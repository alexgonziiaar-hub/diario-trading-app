import { dateKey, isWeekday } from '../lib/format';
import type { Progress, Trade } from './types';

/** Últimos días laborables, del más reciente al más antiguo */
function recentTradingDays(count: number, from = new Date()): string[] {
  const days: string[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (days.length < count) {
    if (isWeekday(d)) days.push(dateKey(d));
    d.setDate(d.getDate() - 1);
  }
  return days;
}

/** Operaciones de ejemplo repartidas en los últimos días laborables */
export function makeDemoTrades(today = new Date()): Trade[] {
  const days = recentTradingDays(6, today);
  const base: Omit<Trade, 'id' | 'date'>[] = [
    { time: '15:42', asset: 'NQ', side: 'Short', setup: 'Absorción en máximo', qty: 1, pts: 18.5, r: 2.1, pnl: 370, mood: 'Calmado', plan: true, note: 'Esperé a que perdiera el nivel, como se explicó en el directo.' },
    { time: '16:05', asset: 'NQ', side: 'Long', setup: 'Rechazo de VWAP', qty: 1, pts: -9, r: -1, pnl: -180, mood: 'Ansioso', plan: false, note: 'Entré antes de tiempo, sin confirmación del delta.' },
    { time: '15:38', asset: 'MNQ', side: 'Long', setup: 'Divergencia de delta', qty: 3, pts: 22, r: 1.8, pnl: 132, mood: 'Confiado', plan: true, note: '' },
    { time: '15:51', asset: 'ES', side: 'Short', setup: 'Ruptura de rango', qty: 1, pts: 6.25, r: 1.5, pnl: 312.5, mood: 'Calmado', plan: true, note: '' },
    { time: '16:20', asset: 'NQ', side: 'Long', setup: 'Imbalance apilado', qty: 1, pts: -8.5, r: -1, pnl: -170, mood: 'FOMO', plan: false, note: 'Imbalance en mitad del rango: justo lo que se dijo que no.' },
    { time: '15:35', asset: 'NQ', side: 'Short', setup: 'Absorción en máximo', qty: 1, pts: 25, r: 2.8, pnl: 500, mood: 'Calmado', plan: true, note: '' },
    { time: '15:47', asset: 'MNQ', side: 'Short', setup: 'Rechazo de VWAP', qty: 2, pts: -10, r: -1, pnl: -40, mood: 'Frustrado', plan: true, note: '' },
    { time: '15:40', asset: 'NQ', side: 'Long', setup: 'Divergencia de delta', qty: 1, pts: 14, r: 1.6, pnl: 280, mood: 'Confiado', plan: true, note: '' }
  ];
  const dayIndex = [0, 1, 1, 2, 3, 3, 4, 5];
  return base.map((t, i) => ({ ...t, id: `demo-${i + 1}`, date: days[dayIndex[i]], demo: true }));
}

/** Progreso de ejemplo en tests anteriores */
export const DEMO_PROGRESS: Record<string, Progress> = {
  '2026-11-09': { idx: 2, answers: { 0: 0, 1: 3 }, finished: false, demo: true },
  '2026-11-06': { idx: 2, answers: { 0: 0, 1: 2, 2: 3 }, finished: true, demo: true },
  '2026-11-05': { idx: 1, answers: { 0: 0, 1: 2 }, finished: true, demo: true }
};

export const DEMO_SAVED: Record<string, boolean> = { '2026-11-06-q3': true, '2026-11-05-q2': true };

export const DEMO_NOTES: Record<string, string> = {
  '2026-11-06-q3': 'Copiar esta plantilla en mi diario: qué vi, por qué entré, si respeté el plan y cómo me sentía.'
};
