import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { EmptyState, Segmented } from '../components/ui';
import { TESTS_BY_DATE } from '../data/tests';
import { dayLabel } from '../lib/format';
import { useAppState } from '../state/AppState';

export default function Apuntes() {
  const nav = useNavigate();
  const { state, toggleSaved } = useAppState();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'guardados' | 'todos'>('guardados');
  const ql = query.trim().toLowerCase();
  const savedCount = Object.values(state.saved).filter(Boolean).length;

  const cards = TESTS_BY_DATE.flatMap((test) =>
    test.questions.map((q, i) => ({ test, q, i })).filter(({ q }) => {
      if (view === 'guardados' && !state.saved[q.id]) return false;
      if (!ql) return true;
      const hay = [q.segments.map((s) => s.text).join(' '), q.text, q.topic, state.notes[q.id] ?? ''].join(' ').toLowerCase();
      return hay.includes(ql);
    })
  );

  const quoteParts = (segments: { text: string; key?: boolean }[]) => {
    const full = segments.map((s) => s.text).join(' ');
    const at = ql ? full.toLowerCase().indexOf(ql) : -1;
    if (at >= 0) return [full.slice(0, at), full.slice(at, at + ql.length), full.slice(at + ql.length)];
    const k = Math.max(0, segments.findIndex((s) => s.key));
    const before = segments.slice(0, k).map((s) => s.text).join(' ');
    const after = segments.slice(k + 1).map((s) => s.text).join(' ');
    return [before ? before + ' ' : '', segments[k].text, after ? ' ' + after : ''];
  };

  return (
    <div className="page">
      <header className="col gap-2">
        <h1 className="h-title">Apuntes</h1>
        <p className="muted small">Los extractos que guardas, para repasarlos antes de operar.</p>
      </header>

      <div className="search">
        <label htmlFor="a-buscar" className="sr-only">
          Buscar en los extractos
        </label>
        <Icon name="search" size={18} className="search__icon" />
        <input id="a-buscar" type="search" className="input search__input" placeholder="Busca: absorción, stop, VWAP…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Segmented
        label="Qué extractos ver"
        value={view}
        onChange={setView}
        options={[
          { value: 'guardados', label: `Guardados (${savedCount})` },
          { value: 'todos', label: 'Todos los extractos' }
        ]}
      />

      <span className="small muted">
        {cards.length} {cards.length === 1 ? 'extracto' : 'extractos'}
        {ql ? ` para «${query.trim()}»` : ''}
      </span>

      {cards.map(({ test, q, i }) => {
        const [pre, hl, post] = quoteParts(q.segments);
        const isSaved = !!state.saved[q.id];
        const answered = state.progress[test.id]?.answers[i] !== undefined;
        const note = state.notes[q.id];
        return (
          <article key={q.id} className="note-card">
            <div className="card__row">
              <span className="mono small faint">
                {dayLabel(test.date)} · {q.start}
              </span>
              <span className="tag">{q.topic}</span>
            </div>
            <p className="quote">
              “{pre}
              <mark>{hl}</mark>
              {post}”
            </p>
            {note && (
              <p className="note-card__note">
                <strong className="text-strong">Mi nota: </strong>
                {note}
              </p>
            )}
            <div className="row gap-8">
              <button
                type="button"
                className="btn btn--secondary note-card__open"
                onClick={() => nav(`/tests/${test.id}`, { state: answered ? { review: i } : { goto: i } })}
              >
                <span className="ellipsis">Ver pregunta: {q.short}</span>
              </button>
              <button type="button" className="icon-btn" data-on={isSaved} aria-pressed={isSaved} aria-label={isSaved ? 'Quitar de mis apuntes' : 'Guardar en mis apuntes'} onClick={() => toggleSaved(q.id)}>
                <Icon name="bookmark" size={16} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>
          </article>
        );
      })}

      {cards.length === 0 && (
        <EmptyState icon={<Icon name="bookmark" size={26} />} title={ql ? `Nada coincide con «${query.trim()}»` : 'Aún no has guardado extractos'}>
          <span className="small muted">Guarda extractos desde cada test o busca en todos.</span>
        </EmptyState>
      )}
    </div>
  );
}
