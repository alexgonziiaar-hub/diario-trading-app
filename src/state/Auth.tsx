import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthError } from '@supabase/supabase-js';
import { ACCOUNTS_ENABLED, supabase } from '../lib/supabase';

export type Role = 'alumno' | 'mentor';
export type Access = 'checking' | 'allowed' | 'denied';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthCtx {
  /** demo = sin cuentas (datos solo en el teléfono) */
  mode: 'demo' | 'accounts';
  ready: boolean;
  user: AuthUser | null;
  access: Access;
  role: Role | null;
  /** Nombre que puso el mentor al autorizar el email (si lo puso) */
  mentorName: string | null;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  recheckAccess: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export const NOT_ALLOWED_MSG = 'Este email no está autorizado todavía. Pide a tu mentor que lo valide: usa el mismo email con el que entraste en Whop.';

function friendlyError(err: AuthError | Error): string {
  const status = (err as AuthError).status;
  const msg = (err.message || '').toLowerCase();
  if (status === 429 || msg.includes('rate limit') || msg.includes('security purposes')) return 'Has pedido varios códigos seguidos. Espera un minuto y vuelve a intentarlo.';
  if (status === 403 || msg.includes('no está autorizado')) return NOT_ALLOWED_MSG;
  if (msg.includes('not authorized') || msg.includes('email address')) return 'Ahora mismo no podemos enviar el código a este email. Avisa a tu mentor.';
  if (msg.includes('fetch') || msg.includes('network')) return 'No hay conexión. Revisa internet y vuelve a intentarlo.';
  return 'Algo ha fallado. Vuelve a intentarlo en un momento.';
}

const accessCacheKey = (uid: string) => `diario-trading-access:${uid}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!ACCOUNTS_ENABLED);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [access, setAccess] = useState<Access>('checking');
  const [role, setRole] = useState<Role | null>(null);
  const [mentorName, setMentorName] = useState<string | null>(null);
  const [checkTick, setCheckTick] = useState(0);

  // Sesión guardada y cambios de sesión
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u?.email ? { id: u.id, email: u.email } : null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser((prev) => (u?.email ? (prev?.id === u.id ? prev : { id: u.id, email: u.email }) : null));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ¿Sigue autorizado este email? (lo decide el mentor)
  useEffect(() => {
    if (!supabase || !user) return;
    let cancelled = false;
    const cached = localStorage.getItem(accessCacheKey(user.id));
    if (cached) {
      const c = JSON.parse(cached) as { role: Role; name: string | null };
      setRole(c.role);
      setMentorName(c.name);
      setAccess('allowed');
    } else {
      setAccess('checking');
    }
    supabase
      .from('allowed_emails')
      .select('role, name, active')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // Sin conexión: si ya estaba autorizado, sigue entrando con sus datos del teléfono
          if (!cached) setAccess('allowed');
          return;
        }
        if (data && data.active) {
          setRole(data.role as Role);
          setMentorName(data.name);
          setAccess('allowed');
          localStorage.setItem(accessCacheKey(user.id), JSON.stringify({ role: data.role, name: data.name }));
        } else {
          setAccess('denied');
          localStorage.removeItem(accessCacheKey(user.id));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, checkTick]);

  const sendCode = useCallback(async (email: string) => {
    if (!supabase) return;
    const clean = email.trim().toLowerCase();
    const { data: ok, error } = await supabase.rpc('email_autorizado', { p_email: clean });
    if (error) throw new Error(friendlyError(error));
    if (!ok) throw new Error(NOT_ALLOWED_MSG);
    const { error: e2 } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true } });
    if (e2) throw new Error(friendlyError(e2));
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    if (error) {
      const m = (error.message || '').toLowerCase();
      if (m.includes('expired') || m.includes('invalid') || error.status === 403) throw new Error('El código no es correcto o ha caducado. Revísalo o pide uno nuevo.');
      throw new Error(friendlyError(error));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    if (user) localStorage.removeItem(accessCacheKey(user.id));
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setRole(null);
    setAccess('checking');
  }, [user]);

  const value: AuthCtx = {
    mode: ACCOUNTS_ENABLED ? 'accounts' : 'demo',
    ready,
    user,
    access,
    role,
    mentorName,
    sendCode,
    verifyCode,
    signOut,
    recheckAccess: () => setCheckTick((t) => t + 1)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
