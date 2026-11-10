import type { ReactNode } from 'react';

/** Botones tipo pastilla con selección única o múltiple */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
  variant = 'pill',
  scroll = false
}: {
  options: readonly T[] | { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  variant?: 'pill' | 'square';
  scroll?: boolean;
}) {
  const items = (options as (T | { value: T; label: string })[]).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div role="group" aria-label={label} className={`chips${scroll ? ' chips--scroll' : ''}`}>
      {items.map((o) => (
        <button key={o.value} type="button" className={`chip chip--${variant}`} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Control segmentado (2–3 opciones) */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="segmented">
      {options.map((o) => (
        <button key={o.value} type="button" className="segmented__btn" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, labelledBy }: { checked: boolean; onChange: (v: boolean) => void; labelledBy: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-labelledby={labelledBy} className="switch" onClick={() => onChange(!checked)}>
      <span className="switch__knob" />
    </button>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'win' | 'loss' }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className={`stat__value mono${tone ? ` text-${tone}` : ''}`}>{value}</span>
    </div>
  );
}

export function ProgressBar({ pct, tone = 'accent' }: { pct: number; tone?: 'accent' | 'win' }) {
  return (
    <span className="progress" aria-hidden="true">
      <span className={`progress__bar progress__bar--${tone}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </span>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <span className="empty__title">{title}</span>
      {children}
    </div>
  );
}
