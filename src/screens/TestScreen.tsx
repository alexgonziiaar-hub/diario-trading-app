import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ExcerptPlayer } from '../components/ExcerptPlayer';
import { Icon } from '../components/Icon';
import { findTest } from '../data/tests';
import { dayLabel, formatHMS, toSeconds } from '../lib/format';
import { emptyProgress } from '../lib/stats';
import { useAppState } from '../state/AppState';

const LETTERS = 'ABCD';

export default function TestScreen() {
  const { testId = '' } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const { state, updateProgress, toggleSaved, setNote } = useAppState();
  const test = findTest(testId);
  const nav_state = (location.state as { review?: number; goto?: number } | null) ?? {};
  const [review, setReview] = useState<number | null>(nav_state.review ?? null);
  const [noteOpen, setNoteOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const p = (test && state.progress[test.id]) || emptyProgress();
  const total = test?.questions.length ?? 0;
  const shown = Math.min(review ?? p.idx, Math.max(0, total - 1));

  // Abrir una pregunta concreta desde Apuntes (solo al entrar)
  const gotoHandled = useRef(false);
  useEffect(() => {
    if (gotoHandled.current || !test || nav_state.goto === undefined) return;
    gotoHandled.current = true;
    if (p.answers[nav_state.goto] === undefined && !p.finished) updateProgress(test.id, { idx: nav_state.goto });
  }, [test, nav_state.goto, p, updateProgress]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setNoteOpen(false);
  }, [shown, review, p.finished]);

  if (!test) return <Navigate to="/tests" replace />;

  const q = test.questions[shown];
  const picked = p.answers[shown];
  const answered = picked !== undefined;
  const inReview = review !== null;
  const showResults = p.finished && !inReview;
  const saved = !!state.saved[q.id];
  const note = state.notes[q.id] ?? '';
  const showNote = noteOpen || !!note;

  const back = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/tests', { replace: true }));

  const nextUnanswered = (() => {
    for (let j = shown + 1; j < total; j++) if (p.answers[j] === undefined) return j;
    for (let j = 0; j < total; j++) if (p.answers[j] === undefined) return j;
    return -1;
  })();

  const pick = (i: number) => {
    if (answered) return;
    updateProgress(test.id, { answers: { ...p.answers, [shown]: i }, idx: shown });
  };

  const next = () => {
    if (inReview) return setReview(null);
    if (!answered) return;
    if (nextUnanswered >= 0) updateProgress(test.id, { idx: nextUnanswered });
    else updateProgress(test.id, { finished: true });
  };

  const correctCount = test.questions.filter((qq, i) => p.answers[i] === qq.correct).length;
  const pct = correctCount / total;
  const diff = Math.round(pct * 100) - test.avg;
  const wrong = test.questions.map((qq, i) => (p.answers[i] === qq.correct ? -1 : i)).filter((i) => i >= 0);

  const retry = () => {
    const answers = { ...p.answers };
    wrong.forEach((i) => delete answers[i]);
    updateProgress(test.id, { answers, idx: wrong[0], finished: false });
    setReview(null);
  };

  const start = toSeconds(q.start);
  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <div className="screen">
      <header className="topbar topbar--test">
        <div className="row gap-6">
          <button type="button" className="icon-btn icon-btn--plain" aria-label="Volver a los tests" onClick={back}>
            <Icon name="chevronLeft" size={22} strokeWidth={2} />
          </button>
          <div className="topbar__center">
            <span className="eyebrow eyebrow--live">Directo · {dayLabel(test.date)}</span>
            <span className="topbar__subtitle ellipsis">{test.title}</span>
          </div>
          <span className="mono small soft topbar__count">{showResults ? `${correctCount}/${total}` : `${shown + 1}/${total}`}</span>
        </div>
        <div className="segments" aria-hidden="true">
          {test.questions.map((qq, j) => {
            const a = p.answers[j];
            const tone = a === undefined ? (j === shown && !showResults ? 'current' : 'todo') : a === qq.correct ? 'win' : 'loss';
            return <span key={qq.id} className="segments__item" data-tone={tone} />;
          })}
        </div>
      </header>

      <div className="scroll" ref={scrollRef}>
        {showResults ? (
          <div className="page page--test">
            <div className="results__head">
              <div className="ring">
                <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label={`${Math.round(pct * 100)}% de aciertos`}>
                  <circle cx="56" cy="56" r={R} className="ring__track" />
                  {pct > 0 && (
                    <circle cx="56" cy="56" r={R} className="ring__value" data-perfect={pct === 1} strokeDasharray={`${(pct * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 56 56)" />
                  )}
                </svg>
                <span className="ring__label mono" aria-hidden="true">
                  {Math.round(pct * 100)}%
                </span>
              </div>
              <div className="col gap-6">
                <span className="eyebrow eyebrow--accent">Test completado</span>
                <h2 className="h-results">
                  {correctCount} de {total} aciertos
                </h2>
                <span className="vs" data-tone={diff >= 0 ? 'win' : 'loss'}>
                  {diff === 0 ? 'Igual que la media' : `${diff > 0 ? '+' : '−'}${Math.abs(diff)} puntos sobre la media`}
                </span>
              </div>
            </div>
            <p className="soft">
              {correctCount === total
                ? 'Perfecto: has entendido todo lo que se explicó en este directo.'
                : correctCount >= total - 1
                  ? 'Muy bien. Repasa el extracto de la que has fallado antes del próximo directo.'
                  : 'Repasa los extractos antes del próximo directo: ahí está todo lo que se explicó.'}
            </p>
            <div className="col gap-8">
              {test.questions.map((qq, i) => {
                const ok = p.answers[i] === qq.correct;
                return (
                  <button key={qq.id} type="button" className="result-row" onClick={() => setReview(i)}>
                    <span className="result-row__mark" data-tone={ok ? 'win' : 'loss'} role="img" aria-label={ok ? 'Acierto' : 'Fallo'}>
                      {ok ? '✓' : '✕'}
                    </span>
                    <span className="col">
                      <span>
                        {i + 1}. {qq.short}
                      </span>
                      <span className="small faint">Ver extracto · {qq.start}</span>
                    </span>
                    <Icon name="chevronRight" size={16} className="faint push-right" />
                  </button>
                );
              })}
            </div>
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={retry} disabled={wrong.length === 0}>
              {wrong.length === 0 ? 'Sin fallos que repasar' : `Repasar mis fallos (${wrong.length})`}
            </button>
            <button type="button" className="btn btn--secondary btn--block btn--lg" onClick={() => nav('/tests')}>
              Volver a los tests
            </button>
          </div>
        ) : (
          <div className="page page--test">
            <span className="eyebrow eyebrow--accent">
              Pregunta {shown + 1} · {q.topic}
            </span>
            <h2 className="q-text">{q.text}</h2>
            {answered && (
              <span className="small muted row gap-6">
                <Icon name="users" size={15} />
                Así respondieron los {test.students} alumnos del directo
              </span>
            )}

            <div className="options">
              {q.options.map((text, i) => {
                const st = !answered ? 'idle' : i === q.correct ? 'correct' : i === picked ? 'wrong' : 'dim';
                return (
                  <button key={i} type="button" className="option" data-state={st} onClick={() => pick(i)} disabled={answered} aria-pressed={answered ? i === picked : undefined}>
                    <span className="option__key mono">{LETTERS[i]}</span>
                    <span className="option__body">
                      <span>{text}</span>
                      {answered && (
                        <span className="option__dist">
                          <span className="progress">
                            <span className="progress__bar" style={{ width: `${q.dist[i]}%` }} />
                          </span>
                          <span className="mono">{q.dist[i]}%</span>
                        </span>
                      )}
                    </span>
                    {st === 'correct' && <Icon name="check" size={20} strokeWidth={2.2} className="text-win" label="Respuesta correcta" />}
                    {st === 'wrong' && <Icon name="x" size={20} strokeWidth={2.2} className="text-loss" label="Tu respuesta, incorrecta" />}
                  </button>
                );
              })}
            </div>

            {answered && picked === q.correct && (
              <div className="feedback feedback--ok" role="status">
                <Icon name="check" size={18} strokeWidth={2.2} />
                <span className="col gap-2">
                  <strong>¡Correcto!</strong>
                  <span className="soft">El {q.dist[q.correct]}% de los alumnos también acertó. Mira cómo se explicó:</span>
                </span>
              </div>
            )}
            {answered && picked !== q.correct && (
              <div className="feedback feedback--bad" role="status">
                <Icon name="x" size={18} strokeWidth={2.2} />
                <span className="col gap-2">
                  <strong>No es la {LETTERS[picked]}.</strong>
                  <span className="soft">{q.whyNot[picked]}</span>
                  <span className="soft">La correcta es la {LETTERS[q.correct]}. Mira cómo se explicó:</span>
                </span>
              </div>
            )}
            {!answered && (
              <p className="hint">
                <Icon name="lock" size={16} />
                El extracto del directo se desbloquea al responder.
              </p>
            )}

            {answered && (
              <section className="excerpt" aria-labelledby="excerpt-t">
                <div className="excerpt__head">
                  <h3 id="excerpt-t" className="eyebrow eyebrow--live">
                    <span className="live-dot" />
                    Extracto del directo
                  </h3>
                  <span className="mono small muted">
                    {formatHMS(start)} – {formatHMS(start + q.len)}
                  </span>
                </div>
                <ExcerptPlayer question={q} youtubeId={test.youtubeId} />
                <div className="excerpt__foot">
                  <p className="soft">
                    <strong className="text-strong">Por qué importa. </strong>
                    {q.why}
                  </p>
                  <div className="grid-2">
                    <button type="button" className="btn btn--secondary" data-on={saved} aria-pressed={saved} onClick={() => toggleSaved(q.id)}>
                      <Icon name="bookmark" size={16} fill={saved ? 'currentColor' : 'none'} />
                      {saved ? 'Guardado' : 'Guardar'}
                    </button>
                    <button type="button" className="btn btn--secondary" aria-expanded={showNote} onClick={() => setNoteOpen(!showNote)}>
                      <Icon name="pencil" size={16} />
                      {note ? 'Mi nota' : 'Añadir nota'}
                    </button>
                  </div>
                  {showNote && (
                    <div className="field">
                      <label className="field__label" htmlFor="q-nota">
                        Tu nota sobre este fragmento
                      </label>
                      <textarea id="q-nota" className="input textarea" rows={3} placeholder="Lo que quieres recordar de este momento…" value={note} onChange={(e) => setNote(q.id, e.target.value)} />
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {!showResults && (
        <div className="bottombar">
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={next} disabled={!inReview && !answered}>
            {inReview ? 'Volver a resultados' : nextUnanswered >= 0 ? 'Siguiente pregunta' : 'Ver resultados'}
            <Icon name="chevronRight" size={18} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
