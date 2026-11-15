import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Chips } from '../components/ui';
import { useToast } from '../components/Toast';
import { ASSETS, MOODS, SETUPS } from '../content';
import type { Side } from '../data/types';
import { dateKey, money, pad, parseNumber, points, rMultiple } from '../lib/format';
import { useAppState } from '../state/AppState';
import { useAuth } from '../state/Auth';

export default function NuevaOperacion() {
  const nav = useNavigate();
  const toast = useToast();
  const { addTrade } = useAppState();
  const { mode } = useAuth();
  const now = new Date();

  const [asset, setAsset] = useState('NQ');
  const [side, setSide] = useState<Side>('Long');
  const [setup, setSetup] = useState(SETUPS[0]);
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(dateKey(now));
  const [time, setTime] = useState(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [stop, setStop] = useState('');
  const [mood, setMood] = useState(MOODS[0]);
  const [plan, setPlan] = useState(true);
  const [note, setNote] = useState('');

  const e = parseNumber(entry);
  const x = parseNumber(exit);
  const s = parseNumber(stop);
  const ok = Number.isFinite(e) && Number.isFinite(x);
  const pointValue = ASSETS.find((a) => a.symbol === asset)?.pointValue ?? 1;
  const pts = ok ? (x - e) * (side === 'Long' ? 1 : -1) : 0;
  const pnl = pts * pointValue * qty;
  const risk = ok && Number.isFinite(s) ? Math.abs(e - s) : 0;
  const r = risk > 0 ? pts / risk : null;
  const tone = pnl >= 0 ? 'win' : 'loss';

  const save = (ev?: FormEvent) => {
    ev?.preventDefault();
    if (!ok) return;
    const id = `t-${Date.now()}`;
    addTrade({
      id,
      date,
      time: time || '—',
      asset,
      side,
      setup,
      qty,
      entry: e,
      exit: x,
      stop: Number.isFinite(s) ? s : undefined,
      pts: Math.round(pts * 100) / 100,
      r: r === null ? null : Math.round(r * 10) / 10,
      pnl: Math.round(pnl * 100) / 100,
      mood,
      plan,
      note: note.trim()
    });
    toast('Operación guardada en tu diario');
    nav('/diario', { replace: true, state: { open: id } });
  };

  return (
    <div className="screen">
      <header className="topbar topbar--form">
        <button type="button" className="link-btn link-btn--muted" onClick={() => nav(-1)}>
          Cancelar
        </button>
        <h1 className="topbar__title">Nueva operación</h1>
        <button type="button" className="link-btn" onClick={() => save()} disabled={!ok}>
          Guardar
        </button>
      </header>

      <form className="scroll" onSubmit={save} noValidate>
        <div className="page page--form">
          <div className="field">
            <span className="field__label" id="n-activo">
              Activo
            </span>
            <Chips label="Activo" value={asset} onChange={setAsset} variant="square" options={ASSETS.map((a) => a.symbol)} />
          </div>

          <div className="field">
            <span className="field__label">Lado</span>
            <div role="group" aria-label="Lado" className="side-btns">
              {(['Long', 'Short'] as Side[]).map((v) => (
                <button key={v} type="button" className={`side-btn side-btn--${v.toLowerCase()}`} aria-pressed={side === v} onClick={() => setSide(v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Setup</span>
            <Chips label="Setup" value={setup} onChange={setSetup} options={SETUPS} />
          </div>

          <div className="grid-2">
            <div className="field">
              <span className="field__label">Contratos</span>
              <div className="stepper">
                <button type="button" aria-label="Quitar un contrato" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span className="mono" aria-live="polite">
                  {qty}
                </span>
                <button type="button" aria-label="Añadir un contrato" onClick={() => setQty((q) => Math.min(100, q + 1))}>
                  +
                </button>
              </div>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="n-hora">
                Hora
              </label>
              <input id="n-hora" type="time" className="input mono" value={time} onChange={(ev) => setTime(ev.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="n-fecha">
              Fecha
            </label>
            <input id="n-fecha" type="date" className="input mono" value={date} max={dateKey(now)} onChange={(ev) => setDate(ev.target.value || dateKey(now))} />
          </div>

          <div className="grid-3">
            <div className="field">
              <label className="field__label" htmlFor="n-entrada">
                Entrada
              </label>
              <input id="n-entrada" className="input mono" inputMode="decimal" placeholder="Precio" value={entry} onChange={(ev) => setEntry(ev.target.value)} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="n-salida">
                Salida
              </label>
              <input id="n-salida" className="input mono" inputMode="decimal" placeholder="Precio" value={exit} onChange={(ev) => setExit(ev.target.value)} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="n-stop">
                Stop
              </label>
              <input id="n-stop" className="input mono" inputMode="decimal" placeholder="Precio" value={stop} onChange={(ev) => setStop(ev.target.value)} />
            </div>
          </div>

          <section className="calc" data-tone={ok ? tone : 'none'} aria-live="polite" aria-label="Resultado calculado">
            <span className="small muted">Resultado calculado</span>
            {ok ? (
              <div className="calc__values">
                <span className={`calc__pnl mono text-${tone}`}>{money(pnl)}</span>
                <span className={`mono text-${tone}`}>{points(pts)} pts</span>
                <span className={`mono text-${tone}`}>{r === null ? 'sin stop' : rMultiple(r)}</span>
              </div>
            ) : (
              <span className="small soft">Escribe entrada y salida y lo calculamos por ti. Con el stop, también la R.</span>
            )}
          </section>

          <div className="field">
            <span className="field__label">Cómo te sentiste</span>
            <Chips label="Cómo te sentiste" value={mood} onChange={setMood} options={MOODS} />
          </div>

          <div className="field">
            <span className="field__label">¿Respetaste tu plan?</span>
            <div role="group" aria-label="¿Respetaste tu plan?" className="side-btns">
              <button type="button" className="side-btn side-btn--yes" aria-pressed={plan} onClick={() => setPlan(true)}>
                Sí
              </button>
              <button type="button" className="side-btn side-btn--no" aria-pressed={!plan} onClick={() => setPlan(false)}>
                No
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="n-nota">
              Nota
            </label>
            <textarea id="n-nota" className="input textarea" rows={3} placeholder="¿Por qué entraste? ¿Qué harías distinto?" value={note} onChange={(ev) => setNote(ev.target.value)} />
          </div>

          <p className="small faint row gap-8">
            <Icon name="lock" size={14} />
            {mode === 'demo' ? 'Se guarda en tu teléfono.' : 'Se guarda en tu cuenta; si no hay conexión, se envía al recuperarla.'}
          </p>
        </div>
      </form>

      <div className="bottombar">
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => save()} disabled={!ok}>
          Guardar operación
        </button>
      </div>
    </div>
  );
}
