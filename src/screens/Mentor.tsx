import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { EmptyState, Switch } from '../components/ui';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/Auth';

interface Row {
  email: string;
  name: string | null;
  role: 'alumno' | 'mentor';
  active: boolean;
  created_at: string;
}

const EMAIL_RE = /[^\s,;<>"']+@[^\s,;<>"']+\.[^\s,;<>"']+/g;

export default function Mentor() {
  const toast = useToast();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error: e } = await supabase.from('allowed_emails').select('email, name, role, active, created_at').order('created_at', { ascending: false });
    if (e) setError('No se ha podido cargar la lista. Revisa tu conexión.');
    else {
      setError('');
      setRows(data as Row[]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const found = Array.from(new Set((input.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase())));

  const add = async () => {
    if (!supabase || found.length === 0) return;
    setBusy(true);
    const { error: e } = await supabase.from('allowed_emails').upsert(
      found.map((email) => ({ email, active: true })),
      { onConflict: 'email' }
    );
    setBusy(false);
    if (e) return toast('No se han podido autorizar. Inténtalo de nuevo.');
    toast(found.length === 1 ? 'Email autorizado' : `${found.length} emails autorizados`);
    setInput('');
    void load();
  };

  const setActive = async (row: Row, active: boolean) => {
    if (!supabase) return;
    setRows((rs) => rs?.map((r) => (r.email === row.email ? { ...r, active } : r)) ?? null);
    const { error: e } = await supabase.from('allowed_emails').update({ active }).eq('email', row.email);
    if (e) {
      toast('No se ha podido cambiar. Inténtalo de nuevo.');
      void load();
    } else toast(active ? 'Acceso activado' : 'Acceso desactivado');
  };

  const remove = async (row: Row) => {
    if (!supabase || !window.confirm(`¿Quitar a ${row.email} de la lista? Perderá el acceso a la app.`)) return;
    const { error: e } = await supabase.from('allowed_emails').delete().eq('email', row.email);
    if (e) return toast('No se ha podido quitar. Inténtalo de nuevo.');
    toast('Email quitado de la lista');
    void load();
  };

  const ql = query.trim().toLowerCase();
  const visible = (rows ?? []).filter((r) => !ql || r.email.includes(ql) || (r.name ?? '').toLowerCase().includes(ql));
  const students = (rows ?? []).filter((r) => r.role === 'alumno');
  const activeCount = students.filter((r) => r.active).length;

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head__text">
          <Link to="/perfil" className="back-link">
            <Icon name="chevronLeft" size={16} strokeWidth={2} />
            Perfil
          </Link>
          <h1 className="h-title">Alumnos</h1>
        </div>
        <span className="tag tag--accent">Mentor</span>
      </header>

      <div className="stat-grid stat-grid--2">
        <div className="tile">
          <span className="tile__value mono">{rows ? activeCount : '—'}</span>
          <span className="small muted">con acceso</span>
        </div>
        <div className="tile">
          <span className="tile__value mono">{rows ? students.length - activeCount : '—'}</span>
          <span className="small muted">desactivados</span>
        </div>
      </div>

      <section className="card" aria-labelledby="m-add">
        <h2 id="m-add" className="h-section">
          Autorizar emails
        </h2>
        <p className="small muted">Pega el email con el que cada alumno entró en Whop. Puedes pegar varios a la vez, uno por línea o separados por comas.</p>
        <label htmlFor="m-emails" className="sr-only">
          Emails a autorizar
        </label>
        <textarea id="m-emails" className="input textarea" rows={3} value={input} onChange={(e) => setInput(e.target.value)} placeholder="alumno@email.com" autoCapitalize="none" />
        <button type="button" className="btn btn--primary btn--block" disabled={busy || found.length === 0} onClick={() => void add()}>
          {found.length > 1 ? `Autorizar ${found.length} emails` : 'Autorizar email'}
        </button>
      </section>

      <div className="search">
        <label htmlFor="m-buscar" className="sr-only">
          Buscar alumno
        </label>
        <Icon name="search" size={18} className="search__icon" />
        <input id="m-buscar" type="search" className="input search__input" placeholder="Buscar por email o nombre" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {rows && (
        <div className="list-group">
          {visible.map((r) => {
            const isMe = r.email === user?.email;
            const id = `m-${r.email.replace(/[^a-z0-9]/gi, '-')}`;
            return (
              <div key={r.email} className="list-row" data-inactive={!r.active}>
                <div className="list-row__text">
                  <span id={id} className="ellipsis">
                    {r.email}
                  </span>
                  <span className="small faint">
                    {r.role === 'mentor' ? 'Mentor' : r.active ? 'Con acceso' : 'Sin acceso'}
                    {r.name ? ` · ${r.name}` : ''}
                  </span>
                </div>
                {!isMe && (
                  <>
                    <Switch checked={r.active} onChange={(v) => void setActive(r, v)} labelledBy={id} />
                    <button type="button" className="icon-btn icon-btn--plain icon-btn--sm" aria-label={`Quitar ${r.email}`} onClick={() => void remove(r)}>
                      <Icon name="trash" size={16} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      {rows && visible.length === 0 && (
        <EmptyState icon={<Icon name="users" size={26} />} title={ql ? 'Nadie coincide con la búsqueda' : 'Todavía no has autorizado a nadie'} />
      )}
    </div>
  );
}
