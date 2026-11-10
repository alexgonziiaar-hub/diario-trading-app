import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { TradeCard } from '../components/TradeCard';
import { Chips, EmptyState, Segmented, Stat } from '../components/ui';
import { dateKey, isWeekday, money, monthLabel } from '../lib/format';
import { dailyTotals, formatPF, summarize, tradesInMonth } from '../lib/stats';
import { useAppState } from '../state/AppState';
import { useToast } from '../components/Toast';

type Filter = 'todas' | 'ganadoras' | 'perdedoras';

interface Cell {
  key: string;
  day: number | null;
  value?: number;
  future?: boolean;
  today?: boolean;
}

function monthCells(year: number, month: number, totals: Record<string, number>, now: Date): Cell[] {
  const cells: Cell[] = [];
  const first = new Date(year, month, 1);
  let lead = (first.getDay() + 6) % 7; // lunes = 0
  if (lead > 4) lead = 0; // empieza en fin de semana: la primera fila arranca el lunes
  for (let i = 0; i < lead; i++) cells.push({ key: `b${i}`, day: null });
  const days = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(now);
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    if (!isWeekday(date)) continue;
    const key = dateKey(date);
    cells.push({ key, day: d, value: totals[key], future: key > todayKey, today: key === todayKey });
  }
  while (cells.length % 5) cells.push({ key: `e${cells.length}`, day: null });
  return cells;
}

export default function Diario() {
  const location = useLocation();
  const toast = useToast();
  const { state, deleteTrade } = useAppState();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [view, setView] = useState<'lista' | 'cal'>('lista');
  const [filter, setFilter] = useState<Filter>('todas');
  const [open, setOpen] = useState<string | null>((location.state as { open?: string } | null)?.open ?? null);

  const month = useMemo(() => tradesInMonth(state.trades, ym.y, ym.m), [state.trades, ym]);
  const sum = summarize(month);
  const list = month.filter((t) => (filter === 'todas' ? true : filter === 'ganadoras' ? t.pnl > 0 : t.pnl < 0));
  const totals = dailyTotals(month);
  const cells = monthCells(ym.y, ym.m, totals, now);
  const green = Object.values(totals).filter((v) => v > 0).length;
  const red = Object.values(totals).filter((v) => v < 0).length;
  const isCurrent = ym.y === now.getFullYear() && ym.m === now.getMonth();

  const shift = (delta: number) => {
    setYm(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
    setOpen(null);
  };

  const remove = (id: string) => {
    if (!window.confirm('¿Eliminar esta operación de tu diario?')) return;
    deleteTrade(id);
    setOpen(null);
    toast('Operación eliminada');
  };

  return (
    <div className="page page--fab">
      <header className="page-head">
        <h1 className="h-title">Diario</h1>
        <div className="month-nav">
          <button type="button" className="icon-btn icon-btn--sm" aria-label="Mes anterior" onClick={() => shift(-1)}>
            <Icon name="chevronLeft" size={18} />
          </button>
          <span className="month-nav__label">{monthLabel(ym.y, ym.m)}</span>
          <button type="button" className="icon-btn icon-btn--sm" aria-label="Mes siguiente" onClick={() => shift(1)} disabled={isCurrent}>
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </header>

      <section className="card" aria-label="Resumen del mes">
        <span className="small muted">Resultado del mes</span>
        <span className={`big-number big-number--xl mono text-${sum.total >= 0 ? 'win' : 'loss'}`}>{money(sum.total)}</span>
        <div className="stat-grid stat-grid--3">
          <Stat label="Operaciones" value={sum.count} />
          <Stat label="Win rate" value={sum.winRate === null ? '—' : `${sum.winRate}%`} />
          <Stat label="Profit factor" value={formatPF(sum.profitFactor)} />
        </div>
      </section>

      <Segmented
        label="Vista del diario"
        value={view}
        onChange={setView}
        options={[
          { value: 'lista', label: 'Operaciones' },
          { value: 'cal', label: 'Calendario' }
        ]}
      />

      {view === 'lista' ? (
        <div className="col gap-10">
          <Chips<Filter>
            label="Filtrar operaciones"
            value={filter}
            onChange={setFilter}
            scroll
            options={[
              { value: 'todas', label: 'Todas' },
              { value: 'ganadoras', label: 'Ganadoras' },
              { value: 'perdedoras', label: 'Perdedoras' }
            ]}
          />
          {list.map((t) => (
            <TradeCard key={t.id} trade={t} open={open === t.id} onToggle={() => setOpen(open === t.id ? null : t.id)} onDelete={() => remove(t.id)} />
          ))}
          {list.length === 0 && (
            <EmptyState icon={<Icon name="journal" size={26} />} title={month.length ? 'No hay operaciones con este filtro' : 'Sin operaciones este mes'}>
              {!month.length && isCurrent && (
                <Link to="/diario/nueva" className="btn btn--primary btn--sm">
                  Apuntar la primera
                </Link>
              )}
            </EmptyState>
          )}
        </div>
      ) : (
        <section className="card" aria-label={`Calendario de ${monthLabel(ym.y, ym.m)}`}>
          <div className="cal">
            {['L', 'M', 'X', 'J', 'V'].map((d) => (
              <span key={d} className="cal__wd mono">
                {d}
              </span>
            ))}
            {cells.map((c) =>
              c.day === null ? (
                <span key={c.key} className="cal__cell cal__cell--blank" />
              ) : (
                <div
                  key={c.key}
                  className="cal__cell"
                  data-tone={c.future ? 'future' : c.value === undefined ? 'flat' : c.value > 0 ? 'win' : c.value < 0 ? 'loss' : 'flat'}
                  data-today={c.today || undefined}
                >
                  <span className="cal__day">{c.day}</span>
                  <span className="cal__val mono">{c.future ? '' : c.value === undefined ? '—' : `${c.value > 0 ? '+' : c.value < 0 ? '−' : ''}${Math.round(Math.abs(c.value))}`}</span>
                </div>
              )
            )}
          </div>
          <div className="legend">
            <span>
              <i className="legend__sw legend__sw--win" />
              {green} en verde
            </span>
            <span>
              <i className="legend__sw legend__sw--loss" />
              {red} en rojo
            </span>
            {isCurrent && (
              <span>
                <i className="legend__sw legend__sw--today" />
                Hoy
              </span>
            )}
          </div>
        </section>
      )}

      <Link to="/diario/nueva" className="fab" aria-label="Apuntar nueva operación">
        <Icon name="plus" size={24} strokeWidth={2.2} />
      </Link>
    </div>
  );
}
