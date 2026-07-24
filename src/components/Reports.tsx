import { useMemo } from 'react';
import { useAppData } from '../store/AppDataContext';
import { formatCurrency, formatMonthLabel, monthKey } from '../utils/format';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CATEGORY_COLORS = [
  '#4f46e5', '#059669', '#d97706', '#dc2626', '#0891b2',
  '#9333ea', '#65a30d', '#e11d48', '#0d9488', '#a855f7',
];

export default function Reports() {
  const { data } = useAppData();

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of data.transactions) {
      if (t.type !== 'expense') continue;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data.transactions]);

  const byMember = useMemo(() => {
    return data.members.map((m) => {
      const income = data.transactions
        .filter((t) => t.memberId === m.id && t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const expense = data.transactions
        .filter((t) => t.memberId === m.id && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      return { name: m.name, הכנסות: income, הוצאות: expense };
    });
  }, [data.members, data.transactions]);

  const byMonth = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const t of data.transactions) {
      const key = monthKey(t.date);
      const entry = map.get(key) ?? { income: 0, expense: 0 };
      if (t.type === 'income') entry.income += t.amount;
      else entry.expense += t.amount;
      map.set(key, entry);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, v]) => ({
        month: formatMonthLabel(key),
        הכנסות: v.income,
        הוצאות: v.expense,
      }));
  }, [data.transactions]);

  const hasData = data.transactions.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">דוחות וגרפים</h2>
        <p className="text-sm text-slate-500">ניתוח מגמות ההוצאות וההכנסות המשפחתיות.</p>
      </div>

      {!hasData ? (
        <div className="text-center text-sm text-slate-400 py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          אין עדיין מספיק נתונים להצגת דוחות. הוסיפו כמה תנועות כדי לראות גרפים כאן.
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-sm mb-3">הכנסות והוצאות לפי חודש</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Line type="monotone" dataKey="הכנסות" stroke="#059669" strokeWidth={2} />
                <Line type="monotone" dataKey="הוצאות" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="font-semibold text-sm mb-3">הוצאות לפי קטגוריה</h3>
              {expenseByCategory.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">אין הוצאות עדיין.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                    >
                      {expenseByCategory.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="font-semibold text-sm mb-3">הכנסות והוצאות לפי בן משפחה</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byMember}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  <Bar dataKey="הכנסות" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="הוצאות" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
