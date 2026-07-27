import { useState } from 'react';
import { useAppData } from '../store/AppDataContext';
import { formatCurrency } from '../utils/format';
import { Plus, Trash2, Repeat, Pause, Play, Landmark } from 'lucide-react';

export default function RecurringExpensesSection() {
  const { data, addRecurringExpense, updateRecurringExpense, removeRecurringExpense } = useAppData();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(data.expenseCategories[0] ?? '');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [memberId, setMemberId] = useState(data.members[0]?.id ?? '');
  const [isLoan, setIsLoan] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');

  const memberById = Object.fromEntries(data.members.map((m) => [m.id, m]));

  const paidSoFar = (recurringId: string) =>
    data.transactions
      .filter((t) => t.recurringId === recurringId)
      .reduce((sum, t) => sum + t.amount, 0);

  const handleAdd = () => {
    const parsedAmount = Number(amount);
    const parsedDay = Number(dayOfMonth);
    const parsedTotal = isLoan ? Number(totalAmount) : undefined;
    if (!name.trim() || !parsedAmount || parsedAmount <= 0 || !memberId) return;
    if (!parsedDay || parsedDay < 1 || parsedDay > 28) return;
    if (isLoan && (!parsedTotal || parsedTotal <= 0)) return;
    addRecurringExpense({
      name: name.trim(),
      amount: parsedAmount,
      category,
      memberId,
      dayOfMonth: parsedDay,
      totalAmount: parsedTotal,
    });
    setName('');
    setAmount('');
    setDayOfMonth('1');
    setIsLoan(false);
    setTotalAmount('');
  };

  const total = data.recurringExpenses.filter((r) => r.active).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
          <Repeat size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">הוצאות קבועות</h2>
          <p className="text-sm text-slate-500">
            ביטוחים, מנויים, משכנתא והלוואות — נרשמות אוטומטית כל חודש.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isLoan}
            onChange={(e) => setIsLoan(e.target.checked)}
            className="accent-indigo-600"
          />
          זוהי משכנתא / הלוואה (עם מעקב יתרה ופרעון)
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs text-slate-500">שם ההוצאה</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isLoan ? 'לדוגמה: משכנתא דירה' : 'לדוגמה: ביטוח רכב'}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">סכום חודשי</label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {isLoan && (
            <div>
              <label className="text-xs text-slate-500">סכום ההלוואה הכולל</label>
              <input
                type="number"
                min={0}
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-500">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {data.expenseCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">יום בחודש לחיוב</label>
            <input
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">בן משפחה</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {data.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} />
          {isLoan ? 'הוספת משכנתא / הלוואה' : 'הוספת הוצאה קבועה'}
        </button>
      </div>

      {data.recurringExpenses.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">סה"כ חודשי (פעילות בלבד)</span>
          <span className="text-lg font-bold text-indigo-600">{formatCurrency(total)}</span>
        </div>
      )}

      <ul className="space-y-2">
        {data.recurringExpenses.length === 0 && (
          <li className="text-center text-sm text-slate-400 py-8">אין הוצאות קבועות עדיין.</li>
        )}
        {data.recurringExpenses.map((r) => {
          const paid = r.totalAmount ? paidSoFar(r.id) : 0;
          const pct = r.totalAmount ? Math.min(100, Math.round((paid / r.totalAmount) * 100)) : 0;
          const finished = !!r.totalAmount && paid >= r.totalAmount;
          const Icon = r.totalAmount ? Landmark : Repeat;
          return (
            <li
              key={r.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 ${
                r.active ? '' : 'opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="text-indigo-500 shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{r.name}</span>
                    {finished && (
                      <span className="text-xs text-emerald-600 font-normal">נפרעה במלואה</span>
                    )}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: memberById[r.memberId]?.color }}
                    />
                    <span className="text-slate-500 font-normal">{memberById[r.memberId]?.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {r.category} · ה-{r.dayOfMonth} בכל חודש
                  </div>
                </div>
                <span className="text-sm font-semibold text-rose-500">{formatCurrency(r.amount)}</span>
                <button
                  onClick={() => updateRecurringExpense(r.id, { active: !r.active })}
                  className="text-slate-400 hover:text-indigo-600 p-1"
                  aria-label={r.active ? 'השהה' : 'הפעל'}
                >
                  {r.active ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => removeRecurringExpense(r.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  aria-label="מחק"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {r.totalAmount && (
                <div className="mt-2 pr-8">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>
                      נותרו {formatCurrency(Math.max(0, r.totalAmount - paid))} מתוך{' '}
                      {formatCurrency(r.totalAmount)}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
