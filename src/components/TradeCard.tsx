import type { Side, Trade } from '../data/types';
import { decimal, money, points, rMultiple, shortDate } from '../lib/format';
import { Icon } from './Icon';
import { Stat } from './ui';

export function SideBadge({ asset, side, size = 44 }: { asset: string; side: Side; size?: number }) {
  return (
    <span className={`side-badge side-badge--${side.toLowerCase()}`} style={{ width: size, height: size }}>
      <span className="side-badge__asset">{asset}</span>
      <span className="side-badge__side">{side}</span>
    </span>
  );
}

export function TradeCard({ trade, open, onToggle, onDelete }: { trade: Trade; open: boolean; onToggle: () => void; onDelete: () => void }) {
  const tone = trade.pnl >= 0 ? 'win' : 'loss';
  const hasPrices = trade.entry !== undefined && trade.exit !== undefined;
  return (
    <div className="trade" data-open={open}>
      <button type="button" className="trade__head" aria-expanded={open} onClick={onToggle}>
        <SideBadge asset={trade.asset} side={trade.side} />
        <span className="trade__main">
          <span className="trade__setup">{trade.setup}</span>
          <span className="trade__meta">
            {shortDate(trade.date)} · {trade.time} · {trade.mood}
          </span>
        </span>
        <span className="trade__result">
          <span className={`trade__pnl mono text-${tone}`}>{money(trade.pnl)}</span>
          <span className={`trade__r mono text-${tone}`}>{rMultiple(trade.r)}</span>
        </span>
      </button>
      {open && (
        <div className="trade__body">
          <div className="stat-grid stat-grid--3">
            <Stat label="Contratos" value={trade.qty} />
            <Stat label="Puntos" value={points(trade.pts)} tone={tone} />
            <Stat label="Plan" value={trade.plan ? 'Sí' : 'No'} tone={trade.plan ? 'win' : 'loss'} />
          </div>
          {hasPrices && (
            <p className="trade__prices mono">
              Entrada {decimal(trade.entry!)} · Salida {decimal(trade.exit!)}
              {trade.stop !== undefined ? ` · Stop ${decimal(trade.stop)}` : ''}
            </p>
          )}
          {trade.note && <p className="trade__note">{trade.note}</p>}
          <button type="button" className="btn btn--text btn--danger" onClick={onDelete}>
            <Icon name="trash" size={16} />
            Eliminar operación
          </button>
        </div>
      )}
    </div>
  );
}
