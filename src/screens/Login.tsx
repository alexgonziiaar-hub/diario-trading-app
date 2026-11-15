import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Icon, Logo } from '../components/Icon';
import { useAppState } from '../state/AppState';
import { useAuth } from '../state/Auth';

function Hero() {
  return (
    <>
      <div className="login__hero">
        <Logo size={56} />
        <h1 className="login__title">Tu diario de trading y los tests de cada directo</h1>
        <p className="muted">Apunta tus operaciones, responde después de cada directo y revive el momento exacto en que se explicó.</p>
      </div>
      <ul className="features">
        <li>
          <span className="features__icon">
            <Icon name="journal" size={18} />
          </span>
          Apunta cada operación en segundos
        </li>
        <li>
          <span className="features__icon">
            <Icon name="tests" size={18} />
          </span>
          Un test nuevo después de cada directo
        </li>
        <li>
          <span className="features__icon">
            <Icon name="video" size={18} />
          </span>
          El fragmento exacto del directo en cada respuesta
        </li>
      </ul>
    </>
  );
}

function Frame({ children, onSubmit }: { children: ReactNode; onSubmit?: (e: FormEvent) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <form className="page page--login" onSubmit={onSubmit ?? ((e) => e.preventDefault())} noValidate>
          {children}
        </form>
      </div>
    </div>
  );
}

/* ---------- versión de prueba (sin cuentas) ---------- */

export function DemoLogin() {
  const { login } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Escribe tu nombre.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Revisa tu email.');
    login({ name: name.trim(), email: email.trim(), code: '' });
  };

  return (
    <Frame onSubmit={submit}>
      <Hero />
      <div className="login__form">
        <div className="field">
          <label className="field__label" htmlFor="l-nombre">
            Nombre
          </label>
          <input id="l-nombre" className="input" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cómo quieres que te llamemos" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="l-email">
            Email
          </label>
          <input id="l-email" className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary btn--block btn--lg">
          Entrar
        </button>
        <p className="demo-note">Versión de prueba: tus datos se guardan solo en este teléfono.</p>
      </div>
    </Frame>
  );
}

/* ---------- acceso con email y código ---------- */

const RESEND_SECONDS = 60;

export function AccountLogin() {
  const { sendCode, verifyCode } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const requestCode = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Revisa tu email.');
    setBusy(true);
    try {
      await sendCode(email);
      setStep('code');
      setCode('');
      setWait(RESEND_SECONDS);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) return setError('El código tiene 6 cifras.');
    setBusy(true);
    try {
      await verifyCode(email, code);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    void (step === 'email' ? requestCode() : confirm());
  };

  return (
    <Frame onSubmit={submit}>
      <Hero />
      {step === 'email' ? (
        <div className="login__form">
          <div className="field">
            <label className="field__label" htmlFor="a-email">
              Tu email
            </label>
            <input
              id="a-email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="El mismo que usas en Whop"
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy ? 'Enviando…' : 'Recibir código'}
          </button>
          <p className="demo-note">Te enviaremos un código de 6 cifras a tu correo. Sin contraseñas.</p>
        </div>
      ) : (
        <div className="login__form">
          <p className="soft">
            Te hemos enviado un código a <strong className="text-strong">{email.trim().toLowerCase()}</strong>. Revisa también la carpeta de spam.
          </p>
          <div className="field">
            <label className="field__label" htmlFor="a-codigo">
              Código de 6 cifras
            </label>
            <input
              id="a-codigo"
              className="input input--otp mono"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="······"
              autoFocus
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy ? 'Comprobando…' : 'Entrar'}
          </button>
          <div className="row gap-8 login__links">
            <button type="button" className="link-btn" onClick={() => void requestCode()} disabled={busy || wait > 0}>
              {wait > 0 ? `Reenviar en ${wait} s` : 'Reenviar código'}
            </button>
            <button
              type="button"
              className="link-btn link-btn--muted"
              onClick={() => {
                setStep('email');
                setError('');
              }}
            >
              Cambiar email
            </button>
          </div>
        </div>
      )}
    </Frame>
  );
}

/** Primera vez: el alumno dice cómo se llama */
export function NameStep({ email, suggested }: { email: string; suggested: string }) {
  const { login, logout } = useAppState();
  const [name, setName] = useState(suggested);
  const [error, setError] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Escribe tu nombre.');
    login({ name: name.trim(), email, code: '' });
  };
  return (
    <Frame onSubmit={submit}>
      <div className="login__hero">
        <Logo size={56} />
        <h1 className="login__title">¡Bienvenido!</h1>
        <p className="muted">Ya tienes acceso. ¿Cómo quieres que te llamemos?</p>
      </div>
      <div className="login__form">
        <div className="field">
          <label className="field__label" htmlFor="n-nombre">
            Tu nombre
          </label>
          <input id="n-nombre" className="input" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary btn--block btn--lg">
          Empezar
        </button>
        <button type="button" className="link-btn link-btn--muted login__center" onClick={logout}>
          No soy yo, salir
        </button>
      </div>
    </Frame>
  );
}

export function NoAccess() {
  const { user, signOut, recheckAccess } = useAuth();
  return (
    <Frame>
      <div className="login__hero">
        <Logo size={56} />
        <h1 className="login__title">Tu acceso no está activo</h1>
        <p className="muted">
          El email <strong className="text-strong">{user?.email}</strong> no está autorizado ahora mismo. Si crees que es un error, escribe a tu mentor.
        </p>
      </div>
      <div className="login__form">
        <button type="button" className="btn btn--secondary btn--block btn--lg" onClick={recheckAccess}>
          Volver a comprobar
        </button>
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => void signOut()}>
          Entrar con otro email
        </button>
      </div>
    </Frame>
  );
}

export function Splash() {
  return (
    <div className="screen splash" aria-busy="true">
      <Logo size={56} />
      <span className="sr-only">Cargando</span>
    </div>
  );
}
