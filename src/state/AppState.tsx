import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_RULES } from '../content';
import { DEMO_NOTES, DEMO_PROGRESS, DEMO_SAVED, makeDemoTrades } from '../data/demo';
import type { Prefs, Profile, Progress, Trade } from '../data/types';
import { dateKey } from '../lib/format';

const STORAGE_KEY = 'diario-trading:v1';

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

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState(), ...JSON.parse(raw) };
  } catch {
    /* datos dañados o sin acceso: empezamos de cero */
  }
  return initialState();
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
}

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [state]);

  const login = useCallback((profile: Profile) => {
    setState((s) => {
      if (s.demoLoaded) return { ...s, profile };
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
  }, []);

  const logout = useCallback(() => setState((s) => ({ ...s, profile: null })), []);

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
