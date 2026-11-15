import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_RULES } from '../content';
import { DEMO_NOTES, DEMO_PROGRESS, DEMO_SAVED, makeDemoTrades } from '../data/demo';
import type { Prefs, Profile, Progress, Trade } from '../data/types';
import { dateKey } from '../lib/format';

export const DEMO_STORAGE_KEY = 'diario-trading:v1';

export interface PersistedState {
  version: 1;
  profile: Profile | null;
  trades: Trade[];
  progress: Record<string, Progress>;
  saved: Record<string, boolean>;
  notes: Record<string, string>;
  planRules: string[];
  planChecks: { date: string; checks: boolean[] };
  prefs: Prefs;
  installDismissed: boolean;
  demoLoaded: boolean;
}

/** Lo que se guarda en la cuenta del alumno (el resto solo afecta a este teléfono) */
const SYNC_KEYS = ['profile', 'trades', 'progress', 'saved', 'notes', 'planRules', 'planChecks', 'prefs'] as const;
type SyncedState = Pick<PersistedState, (typeof SYNC_KEYS)[number]>;

const pickSynced = (s: PersistedState): SyncedState =>
  Object.fromEntries(SYNC_KEYS.map((k) => [k, s[k]])) as SyncedState;

/** Guardado remoto (Supabase). Sin él, los datos se quedan solo en el teléfono. */
export interface Remote {
  load: () => Promise<{ data: Partial<SyncedState>; updatedAt: string } | null>;
  save: (data: SyncedState) => Promise<void>;
}

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'pending';

const initialState = (): PersistedState => ({
  version: 1,
  profile: null,
  trades: [],
  progress: {},
  saved: {},
  notes: {},
  planRules: DEFAULT_RULES,
  planChecks: { date: dateKey(), checks: [] },
  prefs: { newTest: true, journalReminder: true, liveReminder: false, remindNextLive: false },
  installDismissed: false,
  demoLoaded: false
});

function load(key: string): PersistedState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...initialState(), ...JSON.parse(raw) };
  } catch {
    /* datos dañados o sin acceso: empezamos de cero */
  }
  return initialState();
}

interface SyncMeta {
  /** Hay cambios en el teléfono que aún no han llegado al servidor */
  dirty: boolean;
  /** Momento del último cambio local (ms) */
  localAt: number;
}

function readMeta(key: string): SyncMeta {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as SyncMeta;
  } catch {
    /* sin datos */
  }
  return { dirty: false, localAt: 0 };
}

interface Actions {
  login: (profile: Profile) => void;
  logout: () => void;
  addTrade: (trade: Trade) => void;
  deleteTrade: (id: string) => void;
  updateProgress: (testId: string, patch: Partial<Progress>) => void;
  toggleSaved: (questionId: string) => void;
  setNote: (questionId: string, text: string) => void;
  togglePlanCheck: (index: number) => void;
  setPlanRules: (rules: string[]) => void;
  setPref: (key: keyof Prefs, value: boolean) => void;
  dismissInstall: () => void;
  clearDemo: () => void;
}

interface Ctx extends Actions {
  state: PersistedState;
  /** Casillas de "Mi plan de hoy" (se reinician cada día) */
  todayChecks: boolean[];
  hasDemo: boolean;
  syncStatus: SyncStatus;
}

const AppStateContext = createContext<Ctx | null>(null);

interface ProviderProps {
  children: ReactNode;
  storageKey?: string;
  /** Cargar datos de ejemplo al entrar por primera vez (solo en la versión de prueba) */
  seedDemo?: boolean;
  remote?: Remote | null;
  /** Al cerrar sesión (en modo cuentas lo gestiona Auth) */
  onLogout?: () => void;
}

export function AppStateProvider({ children, storageKey = DEMO_STORAGE_KEY, seedDemo = true, remote = null, onLogout }: ProviderProps) {
  const metaKey = `${storageKey}:sync`;
  const [state, setState] = useState<PersistedState>(() => load(storageKey));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(remote ? 'syncing' : 'local');
  const [syncTick, setSyncTick] = useState(0);
  const pulled = useRef(false);
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [state, storageKey]);

  /* ---------- sincronización con la cuenta ---------- */

  const pull = useCallback(async () => {
    if (!remote) return;
    try {
      const r = await remote.load();
      const meta = readMeta(metaKey);
      const localNewer = meta.dirty && r !== null && meta.localAt > Date.parse(r.updatedAt);
      if (r && !localNewer) {
        const merged = { ...pickSynced(initialState()), ...r.data } as SyncedState;
        lastSynced.current = JSON.stringify(merged);
        setState((s) => ({ ...s, ...merged }));
        localStorage.setItem(metaKey, JSON.stringify({ dirty: false, localAt: Date.now() }));
      }
      pulled.current = true;
      setSyncTick((t) => t + 1);
    } catch {
      setSyncStatus('pending');
    }
  }, [remote, metaKey]);

  useEffect(() => {
    void pull();
  }, [pull]);

  useEffect(() => {
    if (!remote) return;
    const retry = () => (pulled.current ? setSyncTick((t) => t + 1) : void pull());
    const onVisible = () => document.visibilityState === 'visible' && retry();
    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', retry);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [remote, pull]);

  useEffect(() => {
    if (!remote || !pulled.current) return;
    const payload = pickSynced(state);
    const json = JSON.stringify(payload);
    if (json === lastSynced.current) {
      setSyncStatus('synced');
      return;
    }
    localStorage.setItem(metaKey, JSON.stringify({ dirty: true, localAt: Date.now() }));
    setSyncStatus('syncing');
    const timer = window.setTimeout(async () => {
      try {
        await remote.save(payload);
        lastSynced.current = json;
        localStorage.setItem(metaKey, JSON.stringify({ dirty: false, localAt: Date.now() }));
        setSyncStatus('synced');
      } catch {
        setSyncStatus('pending');
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [state, remote, syncTick, metaKey]);

  /* ---------- acciones ---------- */

  const login = useCallback(
    (profile: Profile) => {
      setState((s) => {
        if (!seedDemo || s.demoLoaded) return { ...s, profile };
        return {
          ...s,
          profile,
          demoLoaded: true,
          trades: [...makeDemoTrades(), ...s.trades],
          progress: { ...DEMO_PROGRESS, ...s.progress },
          saved: { ...DEMO_SAVED, ...s.saved },
          notes: { ...DEMO_NOTES, ...s.notes }
        };
      });
    },
    [seedDemo]
  );

  const logout = useCallback(() => {
    if (onLogout) onLogout();
    else setState((s) => ({ ...s, profile: null }));
  }, [onLogout]);

  const addTrade = useCallback((trade: Trade) => {
    setState((s) => ({ ...s, trades: [trade, ...s.trades].sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)) }));
  }, []);

  const deleteTrade = useCallback((id: string) => setState((s) => ({ ...s, trades: s.trades.filter((t) => t.id !== id) })), []);

  const updateProgress = useCallback((testId: string, patch: Partial<Progress>) => {
    setState((s) => {
      const prev = s.progress[testId] ?? { idx: 0, answers: {}, finished: false };
      return { ...s, progress: { ...s.progress, [testId]: { ...prev, ...patch, demo: false } } };
    });
  }, []);

  const toggleSaved = useCallback((qid: string) => setState((s) => ({ ...s, saved: { ...s.saved, [qid]: !s.saved[qid] } })), []);

  const setNote = useCallback((qid: string, text: string) => {
    setState((s) => ({ ...s, notes: { ...s.notes, [qid]: text }, saved: text ? { ...s.saved, [qid]: true } : s.saved }));
  }, []);

  const togglePlanCheck = useCallback((index: number) => {
    setState((s) => {
      const today = dateKey();
      const checks = s.planChecks.date === today ? s.planChecks.checks.slice() : [];
      checks[index] = !checks[index];
      return { ...s, planChecks: { date: today, checks } };
    });
  }, []);

  const setPlanRules = useCallback((rules: string[]) => setState((s) => ({ ...s, planRules: rules, planChecks: { date: dateKey(), checks: [] } })), []);

  const setPref = useCallback((key: keyof Prefs, value: boolean) => setState((s) => ({ ...s, prefs: { ...s.prefs, [key]: value } })), []);

  const dismissInstall = useCallback(() => setState((s) => ({ ...s, installDismissed: true })), []);

  const clearDemo = useCallback(() => {
    setState((s) => {
      const progress = Object.fromEntries(Object.entries(s.progress).filter(([, p]) => !p.demo));
      const saved = { ...s.saved };
      const notes = { ...s.notes };
      Object.keys(DEMO_SAVED).forEach((k) => {
        if (!notes[k] || notes[k] === DEMO_NOTES[k]) {
          delete saved[k];
          delete notes[k];
        }
      });
      return { ...s, trades: s.trades.filter((t) => !t.demo), progress, saved, notes };
    });
  }, []);

  const todayChecks = useMemo(() => {
    const ok = state.planChecks.date === dateKey();
    return state.planRules.map((_, i) => (ok ? !!state.planChecks.checks[i] : false));
  }, [state.planChecks, state.planRules]);

  const hasDemo = state.trades.some((t) => t.demo) || Object.values(state.progress).some((p) => p.demo);

  const value: Ctx = {
    state,
    todayChecks,
    hasDemo,
    syncStatus,
    login,
    logout,
    addTrade,
    deleteTrade,
    updateProgress,
    toggleSaved,
    setNote,
    togglePlanCheck,
    setPlanRules,
    setPref,
    dismissInstall,
    clearDemo
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): Ctx {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState debe usarse dentro de AppStateProvider');
  return ctx;
}
