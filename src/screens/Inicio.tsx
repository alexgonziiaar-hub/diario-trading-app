import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { SideBadge } from '../components/TradeCard';
import { ProgressBar, Stat } from '../components/ui';
import { TESTS_BY_DATE } from '../data/tests';
import type { Trade } from '../data/types';
import { dateKey, longToday, money, relativeDay, shortDate } from '../lib/format';
import { buildNotifications } from '../lib/notifications';
import { dailyTotals, formatPF, summarize, testState, testStreak, tradesInMonth } from '../lib/stats';
import { useAppState } from '../state/AppState';
import { useInstall } from '../state/install';

function sparkPoints(trades: Trade[]): string {
  const totals = dailyTotals(trades);
  const days = Object.keys(totals).sort();
  const series = [0];
  let acc = 0;
  days.forEach((d) => {
    acc += totals[d];
    series.push(acc);
  });
  if (series.length < 2) series.push(0);
  const min = Math.min(...series);
  const max = Math.max(...series);
  return series.map((v, i) => `${((i / (series.length - 1)) * 300).toFixed(1)},${(44 - ((v - min) / (max - min || 1)) * 40).toFixed(1)}`).join(' ');
}

function InstallCard() {
  const { state, dismissInstall } = useAppState();
  const install = useInstall();
  if (install.standalone || state.installDismissed) return null;
  return (
    <section className="card card--install" aria-labelledby="install-t">
      <span className="install__icon">
        <Icon name="phone" size={20} />
      </span>
      <div className="install__text">
        <h2 id="install-t">Instala la app en tu teléfono</h2>
        {install.canPrompt ? (
          <p>Ábrela desde la pantalla de inicio, como cualquier otra app.</p>
        ) : install.ios ? (
          <p>
            En Safari, toca <Icon name="share" size={14} className="inline-icon" label="Compartir" /> y después «Añadir a pantalla de inicio».
          </p>
        ) : (
          <p>En el menú del navegador, elige «Instalar app» o «Añadir a pantalla de inicio».</p>
        )}
        {install.canPrompt && (
          <button type="button" className="btn btn--primary btn--sm" onClick={install.prompt}>
            Instalar
          </button>
        )}
      </div>
      <button type="button" className="icon-btn icon-btn--plain" aria-label="Ocultar" onClick={dismissInstall}>
        <Icon name="x" size={18} />
      </button>
    </section>
  );
}

export default function Inicio() {
  const nav = useNavigate();
  const { state, todayChecks, togglePlanCheck } = useAppState();
  const [notifOpen, setNotifOpen] = useState(false);
  const now = new Date();

  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const month = useMemo(() => tradesInMonth(state.trades, year, monthIndex), [state.trades, year, monthIndex]);
  const sum = summarize(month);
  const spark = useMemo(() => sparkPoints(month), [month]);

  const latest = TESTS_BY_DATE[0];
  const ls = testState(latest, state.progress[latest.id]);
  const isToday = latest.date === dateKey(now);
  const streak = testStreak(TESTS_BY_DATE, state.progress);
  const notifications = buildNotifications(state.trades, state.progress, now);
  const pending = notifications.filter((n) => n.tone !== 'win').length;
  const firstName = state.profile?.name.split(' ')[0] ?? '';
  const initials = (state.profile?.name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const testCta = ls.status === 'new' ? 'Empezar test' : ls.status === 'progress' ? 'Continuar test' : 'Ver resultados';
  const testChip = ls.status === 'new' ? 'Nuevo test' : ls.status === 'progress' ? 'Test en curso' : 'Test completado';
  const testMeta = ls.status === 'done' ? `${ls.correct}/${ls.total} aciertos` : ls.status === 'progress' ? `${ls.answered}/${ls.total} respondidas` : `${ls.total} preguntas · ~${ls.total} min`;
  const doneRules = todayChecks.filter(Boolean).length;

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">{longToday(now)}</span>
          <h1 className="h-greet">Hola, {firstName}</h1>
        </div>
        <div className="row gap-8">
          <button type="button" className="icon-btn" aria-label={pending ? `Notificaciones: ${pending} nuevas` : 'Notificaciones'} onClick={() => setNotifOpen(true)}>
            <Icon name="bell" size={20} />
            {pending > 0 && <span className="icon-btn__dot" />}
          </button>
          <Link to="/perfil" className="avatar-btn" aria-label="Tu perfil">
            {initials}
          </Link>
        </div>
      </header>

      <InstallCard />

      <section className="card" data-highlight={ls.status === 'new'} aria-labelledby="hoy-t">
        <div className="card__row">
          <span className="live-chip" data-status={ls.status}>
            <span className="live-chip__dot" />
            {testChip}
          </span>
          <span className="faint small">{isToday ? 'Directo de hoy' : `Último directo · ${relativeDay(latest.date, now)}`}</span>
        </div>
        <h2 id="hoy-t" className="h-card">
          {latest.title}
        </h2>
        <div className="row gap-10">
          <ProgressBar pct={ls.status === 'done' ? 100 : (ls.answered / ls.total) * 100} tone={ls.status === 'done' ? 'win' : 'accent'} />
          <span className="small muted nowrap">{testMeta}</span>
        </div>
        <Link to={`/tests/${latest.id}`} className="btn btn--primary btn--block">
          {testCta}
          <Icon name="chevronRight" size={16} strokeWidth={2} />
        </Link>
      </section>

      <section className="card" aria-labelledby="mes-t">
        <div className="card__row card__row--end">
          <div className="col gap-2">
            <span id="mes-t" className="small muted">
              Resultado de este mes
            </span>
            <span className={`big-number mono text-${sum.total >= 0 ? 'win' : 'loss'}`}>{money(sum.total)}</span>
          </div>
          <svg width="128" height="48" viewBox="0 0 300 48" preserveAspectRatio="none" role="img" aria-label="Evolución del resultado este mes" className="spark">
            <polyline points={spark} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="stat-grid stat-grid--3">
          <Stat label="Win rate" value={sum.winRate === null ? '—' : `${sum.winRate}%`} />
          <Stat label="Profit factor" value={formatPF(sum.profitFactor)} />
          <Stat label="Racha de tests" value={streak} />
        </div>
      </section>

      <Link to="/diario/nueva" className="btn btn--dashed btn--block btn--lg">
        <Icon name="plus" size={18} strokeWidth={2} />
        Apuntar una operación
      </Link>

      <section className="card" aria-labelledby="plan-t">
        <div className="card__row">
          <h2 id="plan-t" className="h-section">
            Mi plan de hoy
          </h2>
          <span className="small faint">
            {doneRules} de {state.planRules.length}
          </span>
        </div>
        <div className="col gap-6">
          {state.planRules.map((rule, i) => (
            <label key={rule + i} className="check-row">
              <input type="checkbox" checked={todayChecks[i]} onChange={() => togglePlanCheck(i)} />
              <span>{rule}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="col gap-8" aria-labelledby="recientes-t">
        <div className="card__row">
          <h2 id="recientes-t" className="h-section">
            Últimas operaciones
          </h2>
          <Link to="/diario" className="link-btn">
            Ver todas
          </Link>
        </div>
        {state.trades.length === 0 && <p className="muted small">Todavía no has apuntado ninguna operación.</p>}
        {state.trades.slice(0, 3).map((t) => (
          <button key={t.id} type="button" className="mini-trade" onClick={() => nav('/diario', { state: { open: t.id } })}>
            <SideBadge asset={t.asset} side={t.side} size={40} />
            <span className="mini-trade__main">
              <span className="ellipsis">{t.setup}</span>
              <span className="small faint">
                {shortDate(t.date)} · {t.time}
              </span>
            </span>
            <span className={`mono strong text-${t.pnl >= 0 ? 'win' : 'loss'}`}>{money(t.pnl)}</span>
          </button>
        ))}
      </section>

      {notifOpen && (
        <Sheet title="Notificaciones" onClose={() => setNotifOpen(false)}>
          {notifications.length === 0 && <p className="muted small">No tienes avisos pendientes.</p>}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className="notif"
              onClick={() => {
                setNotifOpen(false);
                nav(n.to);
              }}
            >
              <span className={`notif__dot notif__dot--${n.tone}`} />
              <span className="notif__text">
                <span className="notif__top">
                  <span className="strong">{n.title}</span>
                  <span className="small faint nowrap">{n.when}</span>
                </span>
                <span className="small muted">{n.body}</span>
              </span>
            </button>
          ))}
        </Sheet>
      )}
    </div>
  );
}
