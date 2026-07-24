import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { v4 as uuid } from 'uuid';
import type { AppData, Contribution, Goal, Member, Transaction } from '../types';
import {
  loadSyncConfig,
  saveSyncConfig,
  subscribeToFamily,
  pushFamilyData,
  type SyncConfig,
} from './sync';

const STORAGE_KEY = 'family-finance-app-data';

const MEMBER_COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0891b2', '#9333ea'];

function defaultData(): AppData {
  return {
    members: [{ id: uuid(), name: 'המשפחה', color: MEMBER_COLORS[0] }],
    transactions: [],
    goals: [],
  };
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.members || !parsed.transactions || !parsed.goals) return defaultData();
    return parsed;
  } catch {
    return defaultData();
  }
}

export type SyncStatus = 'off' | 'connecting' | 'connected' | 'error';

interface AppDataContextValue {
  data: AppData;
  addMember: (name: string, color: string) => void;
  updateMember: (id: string, updates: Partial<Omit<Member, 'id'>>) => void;
  removeMember: (id: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
  removeTransaction: (id: string) => void;
  addGoal: (g: Omit<Goal, 'id' | 'contributions'>) => void;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'contributions'>>) => void;
  removeGoal: (id: string) => void;
  addContribution: (goalId: string, contribution: Omit<Contribution, 'id'>) => void;
  removeContribution: (goalId: string, contributionId: string) => void;
  nextMemberColor: () => string;
  syncConfig: SyncConfig | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  connectSync: (config: SyncConfig) => void;
  disconnectSync: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(loadSyncConfig);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('off');
  const [syncError, setSyncError] = useState<string | null>(null);
  const skipNextPush = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!syncConfig) {
      setSyncStatus('off');
      return;
    }
    setSyncStatus('connecting');
    setSyncError(null);
    const unsubscribe = subscribeToFamily(
      syncConfig,
      (remoteData) => {
        if (remoteData) {
          skipNextPush.current = true;
          setData(remoteData);
        } else {
          pushFamilyData(syncConfig, dataRef.current).catch((err) => {
            setSyncStatus('error');
            setSyncError(err instanceof Error ? err.message : String(err));
          });
        }
        setSyncStatus('connected');
      },
      (message) => {
        setSyncStatus('error');
        setSyncError(message);
      }
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncConfig?.familyCode, syncConfig?.firebaseConfig.projectId]);

  useEffect(() => {
    if (!syncConfig || syncStatus === 'off') return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    pushFamilyData(syncConfig, data).catch((err) => {
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : String(err));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const value = useMemo<AppDataContextValue>(() => ({
    data,
    addMember: (name, color) => {
      setData((d) => ({ ...d, members: [...d.members, { id: uuid(), name, color }] }));
    },
    updateMember: (id, updates) => {
      setData((d) => ({
        ...d,
        members: d.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      }));
    },
    removeMember: (id) => {
      setData((d) => ({
        ...d,
        members: d.members.filter((m) => m.id !== id),
        transactions: d.transactions.filter((t) => t.memberId !== id),
      }));
    },
    addTransaction: (t) => {
      setData((d) => ({ ...d, transactions: [...d.transactions, { ...t, id: uuid() }] }));
    },
    updateTransaction: (id, updates) => {
      setData((d) => ({
        ...d,
        transactions: d.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    removeTransaction: (id) => {
      setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
    },
    addGoal: (g) => {
      setData((d) => ({ ...d, goals: [...d.goals, { ...g, id: uuid(), contributions: [] }] }));
    },
    updateGoal: (id, updates) => {
      setData((d) => ({
        ...d,
        goals: d.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      }));
    },
    removeGoal: (id) => {
      setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
    },
    addContribution: (goalId, contribution) => {
      setData((d) => ({
        ...d,
        goals: d.goals.map((g) =>
          g.id === goalId
            ? { ...g, contributions: [...g.contributions, { ...contribution, id: uuid() }] }
            : g
        ),
      }));
    },
    removeContribution: (goalId, contributionId) => {
      setData((d) => ({
        ...d,
        goals: d.goals.map((g) =>
          g.id === goalId
            ? { ...g, contributions: g.contributions.filter((c) => c.id !== contributionId) }
            : g
        ),
      }));
    },
    nextMemberColor: () => MEMBER_COLORS[data.members.length % MEMBER_COLORS.length],
    syncConfig,
    syncStatus,
    syncError,
    connectSync: (config) => {
      saveSyncConfig(config);
      setSyncConfig(config);
    },
    disconnectSync: () => {
      saveSyncConfig(null);
      setSyncConfig(null);
      setSyncStatus('off');
      setSyncError(null);
    },
  }), [data, syncConfig, syncStatus, syncError]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

export { MEMBER_COLORS };
