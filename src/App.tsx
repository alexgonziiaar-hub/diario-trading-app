import type { ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import Apuntes from './screens/Apuntes';
import Diario from './screens/Diario';
import Inicio from './screens/Inicio';
import Login from './screens/Login';
import NuevaOperacion from './screens/NuevaOperacion';
import Perfil from './screens/Perfil';
import Tests from './screens/Tests';
import TestScreen from './screens/TestScreen';
import { useAppState } from './state/AppState';

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

function RequireLogin({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  return state.profile ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { state } = useAppState();
  return (
    <div className="app-frame">
      <Routes>
        <Route path="/login" element={state.profile ? <Navigate to="/" replace /> : <Login />} />
        <Route
          element={
            <RequireLogin>
              <TabLayout />
            </RequireLogin>
          }
        >
          <Route index element={<Inicio />} />
          <Route path="diario" element={<Diario />} />
          <Route path="tests" element={<Tests />} />
          <Route path="apuntes" element={<Apuntes />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
        <Route
          path="/diario/nueva"
          element={
            <RequireLogin>
              <NuevaOperacion />
            </RequireLogin>
          }
        />
        <Route
          path="/tests/:testId"
          element={
            <RequireLogin>
              <TestScreen />
            </RequireLogin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
