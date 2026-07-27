import { useMemo } from 'react';
import { useAppData } from '../store/AppDataContext';
import { formatCurrency, monthKey } from '../utils/format';
import { ArrowDownCircle, ArrowUpCircle, Wallet, PiggyBank, LayoutDashboard, ListChecks, Plus } from 'lucide-react';

type Tab = 'dashboard' | 'transactions' | 'goals' | 'budgets' | 'recurring' | 'tasks' | 'members' | 'reports';

interface Props {
  onNavigate: (tab: Tab) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const { data } = useAppData();

  const stats = useMemo(() => {
    const currentMonth = monthKey(new Date().toISOString());
    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    for (const t of data.transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
        if (monthKey(t.date) === currentMonth) monthIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (monthKey(t.date) === currentMonth) monthExpense += t.amount;
      }
    }

    return {
      balance: totalIncome - totalExpense,
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
    };
  }, [data.transactions]);

  const totalSaved = useMemo(
    () =>
      data.goals.reduce(
        (sum, g) => sum + g.contributions.reduce((s, c) => s + c.amount, 0),
        0
      ),
    [data.goals]
  );

  const recent = useMemo(
    () => [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [data.transactions]
  );

  const memberById = useMemo(
    () => Object.fromEntries(data.members.map((m) => [m.id, m])),
    [data.members]
  );

  const budgetRows = useMemo(() => {
    const currentMonth = monthKey(new Date().toISOString());
    const spentByCategory: Record<string, number> = {};
    for (const t of data.transactions) {
      if (t.type !== 'expense' || monthKey(t.date) !== currentMonth) continue;
      spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + t.amount;
    }
    return Object.entries(data.budgets)
      .map(([category, limit]) => ({ category, limit, spent: spentByCategory[category] ?? 0 }))
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
  }, [data.transactions, data.budgets]);

  const pendingTasks = useMemo(() => {
    const scopeOrder: Record<string, number> = { week: 0, month: 1, general: 2 };
    return [...data.tasks]
      .filter((t) => !t.done)
      .sort((a, b) => scopeOrder[a.scope] - scopeOrder[b.scope]);
  }, [data.tasks]);

  const scopeLabel: Record<string, string> = { general: 'כללי', week: 'השבוע', month: 'החודש' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/40">
            <LayoutDashboard size={20} className="text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">סקירה כללית</h2>
            <p className="text-sm text-slate-500">מצב הכספים המשפחתי בזמן אמת.</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('transactions')}
          className="flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 shadow-sm shrink-0"
        >
          <Plus size={16} />
          <ArrowDownCircle size={16} />
          רישום הוצאה מהירה
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/40">
              <Wallet size={15} className="text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-xs text-slate-500">יתרה כוללת</span>
          </div>
          <div className={`text-lg font-bold ${stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {formatCurrency(stats.balance)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <ArrowUpCircle size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs text-slate-500">הכנסות החודש</span>
          </div>
          <div className="text-lg font-bold text-emerald-600">{formatCurrency(stats.monthIncome)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40">
              <ArrowDownCircle size={15} className="text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs text-slate-500">הוצאות החודש</span>
          </div>
          <div className="text-lg font-bold text-rose-500">{formatCurrency(stats.monthExpense)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <PiggyBank size={15} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs text-slate-500">סה"כ נחסך</span>
          </div>
          <div className="text-lg font-bold text-amber-600">{formatCurrency(totalSaved)}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40">
                <ListChecks size={13} className="text-emerald-600 dark:text-emerald-400" />
              </span>
              משימות פתוחות
            </h3>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-emerald-600 hover:underline"
            >
              לכל המשימות
            </button>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">אין משימות פתוחות. כל הכבוד!</p>
          ) : (
            <ul className="space-y-2">
              {pendingTasks.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="text-xs text-slate-400 shrink-0">{scopeLabel[t.scope]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="p-1 rounded-md bg-sky-100 dark:bg-sky-900/40">
                <ArrowUpCircle size={13} className="text-sky-600 dark:text-sky-400" />
              </span>
              תנועות אחרונות
            </h3>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-sky-600 hover:underline"
            >
              לכל התנועות
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">אין תנועות עדיין. הוסיפו את הראשונה!</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  {t.type === 'income' ? (
                    <ArrowUpCircle className="text-emerald-600 shrink-0" size={16} />
                  ) : (
                    <ArrowDownCircle className="text-rose-500 shrink-0" size={16} />
                  )}
                  <span className="flex-1 truncate">
                    {t.category} · {memberById[t.memberId]?.name}
                  </span>
                  <span className={t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}>
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/40">
                <PiggyBank size={13} className="text-amber-600 dark:text-amber-400" />
              </span>
              יעדי חיסכון
            </h3>
            <button
              onClick={() => onNavigate('goals')}
              className="text-xs text-amber-600 hover:underline"
            >
              לכל היעדים
            </button>
          </div>
          {data.goals.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">עדיין לא הוגדרו יעדי חיסכון.</p>
          ) : (
            <ul className="space-y-3">
              {data.goals.slice(0, 4).map((g) => {
                const saved = g.contributions.reduce((s, c) => s + c.amount, 0);
                const pct = Math.min(100, Math.round((saved / g.targetAmount) * 100));
                return (
                  <li key={g.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{g.name}</span>
                      <span className="text-slate-400">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="p-1 rounded-md bg-violet-100 dark:bg-violet-900/40">
                <Wallet size={13} className="text-violet-600 dark:text-violet-400" />
              </span>
              תקציבים
            </h3>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs text-violet-600 hover:underline"
            >
              לכל התקציבים
            </button>
          </div>
          {budgetRows.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">עדיין לא הוגדרו תקציבים.</p>
          ) : (
            <ul className="space-y-3">
              {budgetRows.slice(0, 4).map(({ category, limit, spent }) => {
                const pct = Math.min(100, Math.round((spent / limit) * 100));
                const over = spent > limit;
                return (
                  <li key={category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{category}</span>
                      <span className={over ? 'text-rose-500 font-semibold' : 'text-slate-400'}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${over ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-violet-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
