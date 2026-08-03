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
import { DEFAULT_EXPENSE_CATEGORIES, type AppData, type Contribution, type FamilyTask, type Goal, type Member, type RecurringExpense, type TaskScope, type Transaction } from '../types';
import {
  loadSyncConfig,
  saveSyncConfig,
  subscribeToFamily,
  pushFamilyData,
  seedOrAdoptFamilyData,
  type SyncConfig,
  type RemoteFamilyData,
} from './sync';

const STORAGE_KEY = 'family-finance-app-data';
const TIMESTAMP_KEY = 'family-finance-data-timestamp';

const MEMBER_COLORS = ['#0d9488', '#059669', '#d97706', '#dc2626', '#0891b2', '#9333ea'];

function loadDataTimestamp(): number {
  const raw = localStorage.getItem(TIMESTAMP_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function saveDataTimestamp(ts: number) {
  localStorage.setItem(TIMESTAMP_KEY, String(ts));
}

function defaultData(): AppData {
  return {
    members: [{ id: uuid(), name: 'המשפחה', color: MEMBER_COLORS[0] }],
    transactions: [],
    goals: [],
    budgets: {},
    expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
    recurringExpenses: [],
    tasks: [],
  };
}

// Fills in fields missing from data saved (locally or remotely) before they existed.
function normalizeData(d: Partial<AppData>): AppData {
  return {
    members: d.members ?? [],
    transactions: d.transactions ?? [],
    goals: d.goals ?? [],
    budgets: d.budgets ?? {},
    expenseCategories: d.expenseCategories ?? [...DEFAULT_EXPENSE_CATEGORIES],
    recurringExpenses: d.recurringExpenses ?? [],
    tasks: d.tasks ?? [],
  };
}

// Creates transactions for any active recurring expense that's due this
// month and hasn't been generated yet, so fixed costs (insurance,
// subscriptions...) show up without the user re-entering them every month.
function generateDueRecurringTransactions(d: AppData): AppData {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const due = d.recurringExpenses.filter(
    (r) =>
      r.active &&
      r.dayOfMonth <= day &&
      !d.transactions.some((t) => t.recurringId === r.id && t.date.startsWith(monthPrefix))
  );

  const generated: Transaction[] = due.map((r) => ({
    id: uuid(),
    type: 'expense',
    amount: r.amount,
    category: r.category,
    date: `${monthPrefix}-${String(Math.min(r.dayOfMonth, daysInMonth)).padStart(2, '0')}`,
    memberId: r.memberId,
    note: r.name,
    recurringId: r.id,
  }));

  const transactions = generated.length > 0 ? [...d.transactions, ...generated] : d.transactions;

  // Loans/mortgages stop generating new payments once fully repaid.
  let changed = generated.length > 0;
  const recurringExpenses = d.recurringExpenses.map((r) => {
    if (!r.active || !r.totalAmount) return r;
    const paid = transactions
      .filter((t) => t.recurringId === r.id)
      .reduce((sum, t) => sum + t.amount, 0);
    if (paid >= r.totalAmount) {
      changed = true;
      return { ...r, active: false };
    }
    return r;
  });

  if (!changed) return d;
  return { ...d, transactions, recurringExpenses };
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.members || !parsed.transactions || !parsed.goals) return defaultData();
    return normalizeData(parsed);
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
  setBudget: (category: string, limit: number) => void;
  removeBudget: (category: string) => void;
  addExpenseCategory: (name: string) => void;
  removeExpenseCategory: (name: string) => void;
  renameExpenseCategory: (oldName: string, newName: string) => void;
  moveExpenseCategory: (index: number, direction: 'up' | 'down') => void;
  addRecurringExpense: (r: Omit<RecurringExpense, 'id' | 'active'>) => void;
  updateRecurringExpense: (id: string, updates: Partial<Omit<RecurringExpense, 'id'>>) => void;
  removeRecurringExpense: (id: string) => void;
  addTask: (title: string, scope: TaskScope, memberId?: string, dueDate?: string) => void;
  updateTask: (id: string, updates: Partial<Omit<FamilyTask, 'id'>>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
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
  // Timestamp confirming how fresh our local copy is — either the time of
  // our last local edit, or the updatedAt of the last remote snapshot we
  // adopted. Persisted so it survives a reload: without that, refreshing
  // right after an edit (before the push lands) would forget the edit ever
  // happened and let a stale server snapshot silently overwrite it.
  const lastLocalChangeAt = useRef(loadDataTimestamp());

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
    let seeding = false;

    const acceptOrHeal = (remote: RemoteFamilyData) => {
      if (remote.updatedAt < lastLocalChangeAt.current) {
        // The server copy is older than a local change (e.g. an earlier
        // push failed or hadn't landed yet) — re-push local data instead
        // of letting the stale snapshot overwrite it.
        const ts = Date.now();
        lastLocalChangeAt.current = ts;
        saveDataTimestamp(ts);
        pushFamilyData(syncConfig, dataRef.current).catch((err) => {
          setSyncStatus('error');
          setSyncError(err instanceof Error ? err.message : String(err));
        });
      } else {
        lastLocalChangeAt.current = remote.updatedAt;
        saveDataTimestamp(remote.updatedAt);
        skipNextPush.current = true;
        setData(normalizeData(remote.data));
      }
      setSyncStatus('connected');
    };

    const unsubscribe = subscribeToFamily(
      syncConfig,
      (remote) => {
        if (remote) {
          acceptOrHeal(remote);
        } else if (!seeding) {
          // Doc doesn't exist yet: atomically create it (or adopt another
          // device's data if it won the race to create it first).
          seeding = true;
          seedOrAdoptFamilyData(syncConfig, dataRef.current)
            .then(acceptOrHeal)
            .catch((err) => {
              setSyncStatus('error');
              setSyncError(err instanceof Error ? err.message : String(err));
            })
            .finally(() => {
              seeding = false;
            });
        }
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
    const ts = Date.now();
    lastLocalChangeAt.current = ts;
    saveDataTimestamp(ts);
    pushFamilyData(syncConfig, data).catch((err) => {
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : String(err));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    // While a remote family is still loading, wait for its data before
    // generating — otherwise a device with an empty local cache could
    // create duplicates of entries another device already generated.
    if (syncConfig && syncStatus === 'connecting') return;
    setData((d) => generateDueRecurringTransactions(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.recurringExpenses, syncConfig, syncStatus]);

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
    setBudget: (category, limit) => {
      setData((d) => ({ ...d, budgets: { ...d.budgets, [category]: limit } }));
    },
    removeBudget: (category) => {
      setData((d) => {
        const budgets = { ...d.budgets };
        delete budgets[category];
        return { ...d, budgets };
      });
    },
    addExpenseCategory: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setData((d) =>
        d.expenseCategories.includes(trimmed)
          ? d
          : { ...d, expenseCategories: [...d.expenseCategories, trimmed] }
      );
    },
    removeExpenseCategory: (name) => {
      setData((d) => {
        const budgets = { ...d.budgets };
        delete budgets[name];
        return {
          ...d,
          expenseCategories: d.expenseCategories.filter((c) => c !== name),
          budgets,
        };
      });
    },
    renameExpenseCategory: (oldName, newName) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      setData((d) => {
        if (!d.expenseCategories.includes(oldName) || d.expenseCategories.includes(trimmed)) return d;
        const budgets = { ...d.budgets };
        if (oldName in budgets) {
          budgets[trimmed] = budgets[oldName];
          delete budgets[oldName];
        }
        return {
          ...d,
          expenseCategories: d.expenseCategories.map((c) => (c === oldName ? trimmed : c)),
          budgets,
          transactions: d.transactions.map((t) =>
            t.category === oldName ? { ...t, category: trimmed } : t
          ),
        };
      });
    },
    moveExpenseCategory: (index, direction) => {
      setData((d) => {
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= d.expenseCategories.length) return d;
        const categories = [...d.expenseCategories];
        [categories[index], categories[target]] = [categories[target], categories[index]];
        return { ...d, expenseCategories: categories };
      });
    },
    addRecurringExpense: (r) => {
      setData((d) =>
        generateDueRecurringTransactions({
          ...d,
          recurringExpenses: [...d.recurringExpenses, { ...r, id: uuid(), active: true }],
        })
      );
    },
    updateRecurringExpense: (id, updates) => {
      setData((d) =>
        generateDueRecurringTransactions({
          ...d,
          recurringExpenses: d.recurringExpenses.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })
      );
    },
    removeRecurringExpense: (id) => {
      setData((d) => ({
        ...d,
        recurringExpenses: d.recurringExpenses.filter((r) => r.id !== id),
      }));
    },
    addTask: (title, scope, memberId, dueDate) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setData((d) => ({
        ...d,
        tasks: [...d.tasks, { id: uuid(), title: trimmed, scope, memberId, dueDate, done: false }],
      }));
    },
    updateTask: (id, updates) => {
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    toggleTask: (id) => {
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      }));
    },
    removeTask: (id) => {
      setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
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
