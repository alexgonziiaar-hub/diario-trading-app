import { useMemo, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { supabase } from './lib/supabase';
import Apuntes from './screens/Apuntes';
import Diario from './screens/Diario';
import Inicio from './screens/Inicio';
import { AccountLogin, DemoLogin, NameStep, NoAccess, Splash } from './screens/Login';
import Mentor from './screens/Mentor';
import NuevaOperacion from './screens/NuevaOperacion';
import Perfil from './screens/Perfil';
import Tests from './screens/Tests';
import TestScreen from './screens/TestScreen';
import { AppStateProvider, useAppState, type Remote } from './state/AppState';
import { useAuth } from './state/Auth';

function TabLayout() {
  return (
    <div className="screen">
      <main className="scroll">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}

function MentorOnly({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  return role === 'mentor' ? <>{children}</> : <Navigate to="/perfil" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<TabLayout />}>
        <Route index element={<Inicio />} />
        <Route path="diario" element={<Diario />} />
        <Route path="tests" element={<Tests />} />
        <Route path="apuntes" element={<Apuntes />} />
        <Route path="perfil" element={<Perfil />} />
        <Route
          path="mentor"
          element={
            <MentorOnly>
              <Mentor />
            </MentorOnly>
          }
        />
      </Route>
      <Route path="/diario/nueva" element={<NuevaOperacion />} />
      <Route path="/tests/:testId" element={<TestScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Versión de prueba: sin cuentas, datos solo en el teléfono */
function DemoGate() {
  const { state } = useAppState();
  return state.profile ? <AppRoutes /> : <DemoLogin />;
}

/** Con cuentas: el alumno necesita nombre la primera vez */
function AccountGate({ email }: { email: string }) {
  const { state } = useAppState();
  const { mentorName } = useAuth();
  if (!state.profile?.name) return <NameStep email={email} suggested={mentorName ?? ''} />;
  return <AppRoutes />;
}

function makeRemote(userId: string): Remote {
  return {
    async load() {
      const { data, error } = await supabase!.from('user_data').select('data, updated_at').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data ? { data: data.data, updatedAt: data.updated_at } : null;
    },
    async save(payload) {
      const { error } = await supabase!.from('user_data').upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() });
      if (error) throw error;
    }
  };
}

function AccountsApp() {
  const { ready, user, access, signOut } = useAuth();
  const remote = useMemo(() => (user ? makeRemote(user.id) : null), [user]);
  if (!ready) return <Splash />;
  if (!user) return <AccountLogin />;
  if (access === 'checking') return <Splash />;
  if (access === 'denied') return <NoAccess />;
  return (
    <AppStateProvider key={user.id} storageKey={`diario-trading:v1:${user.id}`} seedDemo={false} remote={remote} onLogout={() => void signOut()}>
      <AccountGate email={user.email} />
    </AppStateProvider>
  );
}

export default function App() {
  const { mode } = useAuth();
  return (
    <div className="app-frame">
      {mode === 'accounts' ? (
        <AccountsApp />
      ) : (
        <AppStateProvider>
          <DemoGate />
        </AppStateProvider>
      )}
    </div>
  );
}
