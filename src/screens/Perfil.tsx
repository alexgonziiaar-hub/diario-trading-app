import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useAuth } from '../state/Auth';
import { Stat, Switch } from '../components/ui';
import { useToast } from '../components/Toast';
import { TESTS_BY_DATE } from '../data/tests';
import type { Prefs, Trade } from '../data/types';
import { dateKey } from '../lib/format';
import { summarize, testState } from '../lib/stats';
import { useAppState } from '../state/AppState';

const PREFS: { key: keyof Prefs; label: string; sub: string }[] = [
  { key: 'newTest', label: 'Nuevo test del directo', sub: 'Te avisamos en cuanto esté listo' },
  { key: 'journalReminder', label: 'Recordatorio del diario', sub: 'Todos los días a las 22:00' },
  { key: 'liveReminder', label: 'Aviso antes del directo', sub: '15 minutos antes de empezar' }
];

function toCsv(trades: Trade[]): string {
  const head = ['Fecha', 'Hora', 'Activo', 'Lado', 'Setup', 'Contratos', 'Entrada', 'Salida', 'Stop', 'Puntos', 'R', 'Resultado $', 'Emoción', 'Plan', 'Nota'];
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const num = (v: number | null | undefined) => (v === undefined || v === null ? '' : String(v).replace('.', ','));
  const rows = trades.map((t) =>
    [t.date, t.time, t.asset, t.side, t.setup, t.qty, num(t.entry), num(t.exit), num(t.stop), num(t.pts), num(t.r), num(t.pnl), t.mood, t.plan ? 'Sí' : 'No', t.note].map(esc).join(';')
  );
  return '﻿' + [head.join(';'), ...rows].join('\n');
}

export default function Perfil() {
  const toast = useToast();
  const { state, setPref, setPlanRules, logout, clearDemo, hasDemo, syncStatus } = useAppState();
  const { mode, role } = useAuth();
  const [newRule, setNewRule] = useState('');
  const sum = summarize(state.trades);
  const states = TESTS_BY_DATE.map((t) => testState(t, state.progress[t.id]));
  const answered = states.reduce((n, s) => n + s.answered, 0);
  const correct = states.reduce((n, s) => n + s.correct, 0);
  const finished = states.filter((s) => s.status === 'done').length;
  const name = state.profile?.name ?? '';
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const notifSupported = typeof Notification !== 'undefined';
  const [permission, setPermission] = useState(notifSupported ? Notification.permission : 'denied');

  const exportCsv = () => {
    const blob = new Blob([toCsv(state.trades)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario-trading-${dateKey()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Diario exportado en CSV');
  };

  const addRule = (e: FormEvent) => {
    e.preventDefault();
    const r = newRule.trim();
    if (!r) return;
    setPlanRules([...state.planRules, r]);
    setNewRule('');
  };

  const askPermission = async () => {
    if (!notifSupported) return;
    const res = await Notification.requestPermission();
    setPermission(res);
    if (res === 'granted') toast('Notificaciones activadas');
  };

  return (
    <div className="page">
      <header className="profile-head">
        <span className="avatar avatar--lg">{initials}</span>
        <div className="col gap-2">
          <h1 className="h-profile">{name}</h1>
          <span className="small muted">{state.profile?.email}</span>
        </div>
      </header>

      <div className="stat-grid stat-grid--2">
        <Stat label="Operaciones" value={sum.count} />
        <Stat label="Win rate" value={sum.winRate === null ? '—' : `${sum.winRate}%`} />
        <Stat label="Tests hechos" value={`${finished}/${TESTS_BY_DATE.length}`} />
        <Stat label="Aciertos" value={answered ? `${Math.round((correct / answered) * 100)}%` : '—'} />
      </div>

      {role === 'mentor' && (
        <Link to="/mentor" className="card card--link">
          <span className="install__icon">
            <Icon name="users" size={20} />
          </span>
          <span className="col gap-2">
            <span className="strong">Panel del mentor</span>
            <span className="small muted">Autoriza o quita los emails de tus alumnos</span>
          </span>
          <Icon name="chevronRight" size={18} className="faint push-right" />
        </Link>
      )}

      <section className="col gap-8" aria-labelledby="p-notif">
        <h2 id="p-notif" className="group-title">
          Notificaciones
        </h2>
        <div className="list-group">
          {PREFS.map((p) => (
            <div key={p.key} className="list-row">
              <div className="list-row__text">
                <span id={`pref-${p.key}`}>{p.label}</span>
                <span className="small faint">{p.sub}</span>
              </div>
              <Switch checked={state.prefs[p.key]} onChange={(v) => setPref(p.key, v)} labelledBy={`pref-${p.key}`} />
            </div>
          ))}
          {notifSupported && permission !== 'granted' && (
            <div className="list-row list-row--note">
              <span className="small muted">Para recibir avisos, permite las notificaciones en este teléfono.</span>
              <button type="button" className="btn btn--secondary btn--sm" onClick={askPermission} disabled={permission === 'denied'}>
                {permission === 'denied' ? 'Bloqueadas' : 'Permitir'}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="col gap-8" aria-labelledby="p-plan">
        <h2 id="p-plan" className="group-title">
          Mi plan de trading
        </h2>
        <div className="list-group">
          {state.planRules.map((rule, i) => (
            <div key={rule + i} className="list-row">
              <Icon name="check" size={16} strokeWidth={2} className="text-accent" />
              <span className="list-row__text">{rule}</span>
              <button type="button" className="icon-btn icon-btn--plain icon-btn--sm" aria-label={`Quitar la regla: ${rule}`} onClick={() => setPlanRules(state.planRules.filter((_, j) => j !== i))}>
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
          <form className="list-row" onSubmit={addRule}>
            <label htmlFor="p-regla" className="sr-only">
              Nueva regla
            </label>
            <input id="p-regla" className="input input--bare" placeholder="Añadir una regla a tu plan" value={newRule} onChange={(e) => setNewRule(e.target.value)} maxLength={80} />
            <button type="submit" className="btn btn--secondary btn--sm" disabled={!newRule.trim()}>
              Añadir
            </button>
          </form>
        </div>
      </section>

      <section className="col gap-8" aria-labelledby="p-cuenta">
        <h2 id="p-cuenta" className="group-title">
          Cuenta
        </h2>
        <div className="list-group">
          <button type="button" className="list-row list-row--btn" onClick={exportCsv}>
            <span className="list-row__text">Exportar mi diario (CSV)</span>
            <Icon name="download" size={18} className="faint" />
          </button>
          {hasDemo && (
            <button
              type="button"
              className="list-row list-row--btn"
              onClick={() => {
                if (window.confirm('Se borrarán las operaciones y respuestas de ejemplo. Lo que hayas apuntado tú se queda.')) {
                  clearDemo();
                  toast('Datos de ejemplo borrados');
                }
              }}
            >
              <span className="list-row__text">Borrar datos de ejemplo</span>
              <Icon name="trash" size={18} className="faint" />
            </button>
          )}
          <button type="button" className="list-row list-row--btn text-loss" onClick={logout}>
            <span className="list-row__text">Cerrar sesión</span>
          </button>
        </div>
      </section>

      <p className="demo-note" role="status">
        {mode === 'demo'
          ? 'Versión de prueba · Tus datos se guardan solo en este teléfono.'
          : syncStatus === 'synced'
            ? 'Todo guardado en tu cuenta.'
            : syncStatus === 'syncing'
              ? 'Guardando en tu cuenta…'
              : 'Sin conexión: tus cambios se guardarán en tu cuenta al recuperarla.'}
      </p>
    </div>
  );
}
