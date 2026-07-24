import { useMemo } from 'react';
import { useAppData } from '../store/AppDataContext';
import { formatCurrency, monthKey } from '../utils/format';
import { ArrowDownCircle, ArrowUpCircle, Wallet, PiggyBank } from 'lucide-react';

type Tab = 'dashboard' | 'transactions' | 'goals' | 'budgets' | 'members' | 'reports';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">סקירה כללית</h2>
        <p className="text-sm text-slate-500">מצב הכספים המשפחתי בזמן אמת.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Wallet size={14} /> יתרה כוללת
          </div>
          <div className={`text-lg font-bold ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(stats.balance)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <ArrowUpCircle size={14} /> הכנסות החודש
          </div>
          <div className="text-lg font-bold text-emerald-600">{formatCurrency(stats.monthIncome)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <ArrowDownCircle size={14} /> הוצאות החודש
          </div>
          <div className="text-lg font-bold text-red-500">{formatCurrency(stats.monthExpense)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <PiggyBank size={14} /> סה"כ נחסך
          </div>
          <div className="text-lg font-bold text-indigo-600">{formatCurrency(totalSaved)}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">תנועות אחרונות</h3>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-indigo-600 hover:underline"
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
                    <ArrowDownCircle className="text-red-500 shrink-0" size={16} />
                  )}
                  <span className="flex-1 truncate">
                    {t.category} · {memberById[t.memberId]?.name}
                  </span>
                  <span className={t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}>
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
            <h3 className="font-semibold text-sm">יעדי חיסכון</h3>
            <button
              onClick={() => onNavigate('goals')}
              className="text-xs text-indigo-600 hover:underline"
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
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">תקציבים</h3>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs text-indigo-600 hover:underline"
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
                      <span className={over ? 'text-red-500 font-semibold' : 'text-slate-400'}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-600'}`}
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
