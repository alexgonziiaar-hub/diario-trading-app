import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Chips, ProgressBar } from '../components/ui';
import { NEXT_LIVE, TOPICS } from '../content';
import { TESTS_BY_DATE } from '../data/tests';
import { dateKey, dayLabel, longDate } from '../lib/format';
import { testState } from '../lib/stats';
import { useAppState } from '../state/AppState';

export default function Tests() {
  const { state, setPref } = useAppState();
  const [topic, setTopic] = useState('Todos');

  const states = TESTS_BY_DATE.map((t) => ({ test: t, s: testState(t, state.progress[t.id]) }));
  const answered = states.reduce((n, x) => n + x.s.answered, 0);
  const correct = states.reduce((n, x) => n + x.s.correct, 0);
  const finished = states.filter((x) => x.s.status === 'done').length;
  const visible = states.filter((x) => topic === 'Todos' || x.test.questions.some((q) => q.topic === topic));
  const showNext = NEXT_LIVE && NEXT_LIVE.date >= dateKey();
  const remind = state.prefs.remindNextLive;

  return (
    <div className="page">
      <header className="col gap-2">
        <h1 className="h-title">Tests</h1>
        <p className="muted small">Un test nuevo después de cada directo.</p>
      </header>

      <div className="stat-grid stat-grid--2">
        <div className="tile">
          <span className="tile__value mono">{answered ? `${Math.round((correct / answered) * 100)}%` : '—'}</span>
          <span className="small muted">de aciertos</span>
        </div>
        <div className="tile">
          <span className="tile__value mono">
            {finished}/{TESTS_BY_DATE.length}
          </span>
          <span className="small muted">tests completados</span>
        </div>
      </div>

      <Chips label="Filtrar por tema" value={topic} onChange={setTopic} options={['Todos', ...TOPICS]} scroll />

      <div className="col gap-10">
        {visible.map(({ test, s }) => (
          <Link key={test.id} to={`/tests/${test.id}`} className="test-card" data-new={s.status === 'new'}>
            <span className="card__row">
              <span className="mono small faint">{dayLabel(test.date)}</span>
              <span className="status" data-status={s.status}>
                {s.status === 'new' && <span className="status__dot" />}
                {s.status === 'new' ? 'Nuevo' : s.status === 'progress' ? 'En curso' : 'Hecho'}
              </span>
            </span>
            <span className="test-card__title">{test.title}</span>
            <span className="row gap-10">
              <ProgressBar pct={s.status === 'done' ? 100 : (s.answered / s.total) * 100} tone={s.status === 'done' ? 'win' : 'accent'} />
              <span className="small muted nowrap">
                {s.status === 'done' ? `${s.correct}/${s.total} aciertos` : s.status === 'progress' ? `${s.answered}/${s.total} respondidas` : `${s.total} preguntas · ~${s.total} min`}
              </span>
            </span>
          </Link>
        ))}
        {visible.length === 0 && <p className="muted small">No hay tests de este tema todavía.</p>}
      </div>

      {showNext && NEXT_LIVE && (
        <section className="card" aria-labelledby="proximo-t">
          <span className="eyebrow">Próximo directo</span>
          <h2 id="proximo-t" className="h-section">
            {longDate(NEXT_LIVE.date).replace(/^./, (c) => c.toUpperCase())} · {NEXT_LIVE.time}
          </h2>
          <span className="small muted">{NEXT_LIVE.title}</span>
          <button type="button" className="btn btn--secondary btn--block" data-on={remind} aria-pressed={remind} onClick={() => setPref('remindNextLive', !remind)}>
            <Icon name="bell" size={16} fill={remind ? 'currentColor' : 'none'} />
            {remind ? 'Te lo recordaremos' : 'Recordármelo'}
          </button>
        </section>
      )}
    </div>
  );
}
