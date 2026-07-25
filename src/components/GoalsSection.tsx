import { useState } from 'react';
import { useAppData } from '../store/AppDataContext';
import { formatCurrency, todayIso } from '../utils/format';
import { Plus, Trash2, Target, PiggyBank } from 'lucide-react';
import type { Goal } from '../types';

function goalTotal(goal: Goal): number {
  return goal.contributions.reduce((sum, c) => sum + c.amount, 0);
}

export default function GoalsSection() {
  const { data, addGoal, removeGoal, addContribution, removeContribution } = useAppData();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contributionInputs, setContributionInputs] = useState<Record<string, string>>({});

  const handleAdd = () => {
    const target = Number(targetAmount);
    if (!name.trim() || !target || target <= 0) return;
    addGoal({ name: name.trim(), targetAmount: target, deadline: deadline || undefined });
    setName('');
    setTargetAmount('');
    setDeadline('');
  };

  const handleContribute = (goalId: string) => {
    const value = Number(contributionInputs[goalId]);
    if (!value || value <= 0) return;
    addContribution(goalId, { amount: value, date: todayIso() });
    setContributionInputs((prev) => ({ ...prev, [goalId]: '' }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">יעדי חיסכון</h2>
        <p className="text-sm text-slate-500">הגדירו יעדים משפחתיים ועקבו אחרי ההתקדמות.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs text-slate-500">שם היעד</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: חופשה משפחתית"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">סכום יעד</label>
            <input
              type="number"
              min={0}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">תאריך יעד (אופציונלי)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          <Plus size={16} />
          יצירת יעד
        </button>
      </div>

      <div className="space-y-4">
        {data.goals.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-8">אין יעדי חיסכון עדיין.</div>
        )}
        {data.goals.map((goal) => {
          const saved = goalTotal(goal);
          const pct = Math.min(100, Math.round((saved / goal.targetAmount) * 100));
          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PiggyBank className="text-teal-600 dark:text-teal-400" size={20} />
                  <div>
                    <div className="font-semibold">{goal.name}</div>
                    {goal.deadline && (
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Target size={12} /> יעד לתאריך {goal.deadline}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                  aria-label="מחק יעד"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{formatCurrency(saved)} מתוך {formatCurrency(goal.targetAmount)}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={contributionInputs[goal.id] ?? ''}
                  onChange={(e) =>
                    setContributionInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))
                  }
                  placeholder="סכום להפקדה"
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={() => handleContribute(goal.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  הפקדה
                </button>
              </div>

              {goal.contributions.length > 0 && (
                <ul className="text-xs text-slate-500 space-y-1">
                  {[...goal.contributions]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 5)
                    .map((c) => (
                      <li key={c.id} className="flex justify-between items-center">
                        <span>{c.date}</span>
                        <span className="flex items-center gap-2">
                          {formatCurrency(c.amount)}
                          <button
                            onClick={() => removeContribution(goal.id, c.id)}
                            className="text-slate-300 hover:text-red-500"
                            aria-label="מחק הפקדה"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
