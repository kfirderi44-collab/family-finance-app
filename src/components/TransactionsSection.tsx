import { useMemo, useState } from 'react';
import { useAppData } from '../store/AppDataContext';
import { INCOME_CATEGORIES, type TransactionType } from '../types';
import { formatCurrency, todayIso } from '../utils/format';
import { Plus, Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export default function TransactionsSection() {
  const { data, addTransaction, removeTransaction } = useAppData();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(data.expenseCategories[0] ?? '');
  const [date, setDate] = useState(todayIso());
  const [memberId, setMemberId] = useState(data.members[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');

  const categories = type === 'expense' ? data.expenseCategories : INCOME_CATEGORIES;

  const handleTypeChange = (t: TransactionType) => {
    setType(t);
    setCategory(t === 'expense' ? (data.expenseCategories[0] ?? '') : INCOME_CATEGORIES[0]);
  };

  const handleAdd = () => {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0 || !memberId) return;
    addTransaction({ type, amount: parsed, category, date, memberId, note: note.trim() || undefined });
    setAmount('');
    setNote('');
  };

  const memberById = useMemo(
    () => Object.fromEntries(data.members.map((m) => [m.id, m])),
    [data.members]
  );

  const sorted = useMemo(
    () =>
      [...data.transactions]
        .filter((t) => filterMember === 'all' || t.memberId === filterMember)
        .filter((t) => filterType === 'all' || t.type === filterType)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.transactions, filterMember, filterType]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">הכנסות והוצאות</h2>
        <p className="text-sm text-slate-500">רשמו תנועה חדשה ועקבו אחרי כל ההיסטוריה.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium border ${
              type === 'expense'
                ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-950 dark:text-red-300'
                : 'border-slate-300 dark:border-slate-600 text-slate-500'
            }`}
          >
            <ArrowDownCircle size={16} />
            הוצאה
          </button>
          <button
            onClick={() => handleTypeChange('income')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium border ${
              type === 'income'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-600 text-slate-500'
            }`}
          >
            <ArrowUpCircle size={16} />
            הכנסה
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500">סכום</label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">תאריך</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">בן משפחה</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {data.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <label className="text-xs text-slate-500">הערה (אופציונלי)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="לדוגמה: קניות שבועיות"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          <Plus size={16} />
          הוספת תנועה
        </button>
      </div>

      <div className="flex gap-2">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | TransactionType)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="all">הכל</option>
          <option value="income">הכנסות</option>
          <option value="expense">הוצאות</option>
        </select>
        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="all">כל בני המשפחה</option>
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {sorted.length === 0 && (
          <li className="text-center text-sm text-slate-400 py-8">אין תנועות להצגה עדיין.</li>
        )}
        {sorted.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
          >
            {t.type === 'income' ? (
              <ArrowUpCircle className="text-emerald-600 shrink-0" size={20} />
            ) : (
              <ArrowDownCircle className="text-red-500 shrink-0" size={20} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{t.category}</span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: memberById[t.memberId]?.color }}
                />
                <span className="text-slate-500 font-normal">{memberById[t.memberId]?.name}</span>
              </div>
              <div className="text-xs text-slate-400 truncate">
                {t.date}
                {t.note ? ` · ${t.note}` : ''}
              </div>
            </div>
            <span
              className={`text-sm font-semibold ${
                t.type === 'income' ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {t.type === 'income' ? '+' : '-'}
              {formatCurrency(t.amount)}
            </span>
            <button
              onClick={() => removeTransaction(t.id)}
              className="text-slate-400 hover:text-red-600 p-1"
              aria-label="מחק"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
