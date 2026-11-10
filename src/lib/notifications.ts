import { TESTS_BY_DATE } from '../data/tests';
import type { Progress, Trade } from '../data/types';
import { dateKey, isWeekday, relativeDay } from './format';
import { testState, testStreak } from './stats';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  when: string;
  tone: 'live' | 'accent' | 'win';
  to: string;
}

/** Avisos que la app calcula con los datos del alumno */
export function buildNotifications(trades: Trade[], progress: Record<string, Progress>, now = new Date()): AppNotification[] {
  const out: AppNotification[] = [];
  TESTS_BY_DATE.forEach((t) => {
    if (testState(t, progress[t.id]).status === 'new') {
      out.push({
        id: `test-${t.id}`,
        title: 'Nuevo test del directo',
        body: `${t.title} · ${t.questions.length} preguntas`,
        when: relativeDay(t.date, now),
        tone: 'live',
        to: `/tests/${t.id}`
      });
    }
  });
  if (isWeekday(now) && !trades.some((t) => t.date === dateKey(now))) {
    out.push({
      id: 'journal',
      title: 'Rellena tu diario',
      body: 'Hoy no has apuntado ninguna operación. ¿Has operado?',
      when: 'hoy',
      tone: 'accent',
      to: '/diario/nueva'
    });
  }
  const streak = testStreak(TESTS_BY_DATE, progress);
  if (streak >= 2) {
    out.push({
      id: 'streak',
      title: `Racha de ${streak} tests`,
      body: 'Has hecho seguidos los tests de los últimos directos.',
      when: '',
      tone: 'win',
      to: '/tests'
    });
  }
  return out;
}
