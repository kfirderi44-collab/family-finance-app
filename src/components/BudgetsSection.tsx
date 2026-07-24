import { useMemo, useState } from 'react';
import { useAppData } from '../store/AppDataContext';
import { EXPENSE_CATEGORIES } from '../types';
import { formatCurrency, monthKey } from '../utils/format';
import { AlertTriangle, X } from 'lucide-react';

export default function BudgetsSection() {
  const { data, setBudget, removeBudget } = useAppData();
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const spentByCategory = useMemo(() => {
    const currentMonth = monthKey(new Date().toISOString());
    const map: Record<string, number> = {};
    for (const t of data.transactions) {
      if (t.type !== 'expense' || monthKey(t.date) !== currentMonth) continue;
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    }
    return map;
  }, [data.transactions]);

  const handleSave = (category: string) => {
    const value = Number(inputs[category]);
    if (!value || value <= 0) return;
    setBudget(category, value);
    setInputs((prev) => ({ ...prev, [category]: '' }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">תקציבים לפי קטגוריה</h2>
        <p className="text-sm text-slate-500">
          קבעו תקרת הוצאה חודשית לכל קטגוריה, ועקבו כמה נשאר לכם — מתעדכן אוטומטית בכל הוצאה חדשה.
        </p>
      </div>

      <div className="space-y-3">
        {EXPENSE_CATEGORIES.map((category) => {
          const limit = data.budgets[category];
          const spent = spentByCategory[category] ?? 0;
          const pct = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          const over = limit ? spent > limit : false;
          const barColor = over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-600';

          return (
            <div
              key={category}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="font-semibold text-sm">{category}</span>
                {limit ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      תקרה: {formatCurrency(limit)}/חודש
                    </span>
                    <button
                      onClick={() => removeBudget(category)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      aria-label="הסר תקציב"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={inputs[category] ?? ''}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, [category]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && handleSave(category)}
                      placeholder="הגדר תקרה"
                      className="w-28 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleSave(category)}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      שמירה
                    </button>
                  </div>
                )}
              </div>

              {limit ? (
                <>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>
                      {formatCurrency(spent)} מתוך {formatCurrency(limit)}
                    </span>
                    <span className={over ? 'text-red-500 font-semibold' : ''}>{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {over && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
                      <AlertTriangle size={13} />
                      חריגה של {formatCurrency(spent - limit)} מהתקציב החודשי
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400">
                  הוצאות החודש בקטגוריה זו: {formatCurrency(spent)} — לא הוגדרה תקרה
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
