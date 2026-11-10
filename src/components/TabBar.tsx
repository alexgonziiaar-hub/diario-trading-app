import { NavLink } from 'react-router-dom';
import { TESTS } from '../data/tests';
import { testState } from '../lib/stats';
import { useAppState } from '../state/AppState';
import { Icon } from './Icon';

const TABS = [
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/diario', label: 'Diario', icon: 'journal', end: false },
  { to: '/tests', label: 'Tests', icon: 'tests', end: false },
  { to: '/apuntes', label: 'Apuntes', icon: 'bookmark', end: false },
  { to: '/perfil', label: 'Perfil', icon: 'user', end: false }
];

export function TabBar() {
  const { state } = useAppState();
  const newTests = TESTS.filter((t) => testState(t, state.progress[t.id]).status === 'new').length;

  return (
    <nav className="tabbar" aria-label="Secciones de la app">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className="tabbar__item">
          <span className="tabbar__icon">
            <Icon name={t.icon} size={22} />
            {t.icon === 'tests' && newTests > 0 && (
              <span className="tabbar__badge">
                {newTests}
                <span className="sr-only"> {newTests === 1 ? 'test nuevo' : 'tests nuevos'}</span>
              </span>
            )}
          </span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
