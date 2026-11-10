import { useState, type FormEvent } from 'react';
import { Icon, Logo } from '../components/Icon';
import { useAppState } from '../state/AppState';

export default function Login() {
  const { login } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Escribe tu nombre.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Revisa tu email.');
    if (!code.trim()) return setError('Escribe tu código de alumno.');
    login({ name: name.trim(), email: email.trim(), code: code.trim().toUpperCase() });
  };

  return (
    <div className="screen">
      <div className="scroll">
        <form className="page page--login" onSubmit={submit} noValidate>
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
            <div className="field">
              <label className="field__label" htmlFor="l-codigo">
                Código de alumno
              </label>
              <input
                id="l-codigo"
                className="input input--code mono"
                autoCapitalize="characters"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Te lo damos al inscribirte"
              />
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
        </form>
      </div>
    </div>
  );
}
