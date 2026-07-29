import { useState } from 'react';
import { useAppData } from '../store/AppDataContext';
import { todayIso } from '../utils/format';
import type { FamilyTask, TaskScope } from '../types';
import { ListChecks, CalendarDays, CalendarRange, Calendar, Plus, Trash2 } from 'lucide-react';

const SCOPES: { id: TaskScope; label: string; icon: typeof ListChecks }[] = [
  { id: 'general', label: 'כללי', icon: ListChecks },
  { id: 'week', label: 'השבוע', icon: CalendarDays },
  { id: 'month', label: 'החודש', icon: CalendarRange },
  { id: 'date', label: 'יום ספציפי', icon: Calendar },
];

const SCOPE_GROUPS: { id: TaskScope; title: string; icon: typeof ListChecks }[] = [
  { id: 'general', title: 'משימות כלליות', icon: ListChecks },
  { id: 'week', title: 'משימות לשבוע הקרוב', icon: CalendarDays },
  { id: 'month', title: 'משימות לחודש הקרוב', icon: CalendarRange },
  { id: 'date', title: 'משימות ליום ספציפי', icon: Calendar },
];

function TaskGroup({
  title,
  icon: Icon,
  tasks,
  memberById,
  onToggle,
  onRemove,
}: {
  title: string;
  icon: typeof ListChecks;
  tasks: FamilyTask[];
  memberById: Record<string, { name: string; color: string }>;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
        <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40">
          <Icon size={13} className="text-emerald-600 dark:text-emerald-400" />
        </span>
        {title}
      </h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">אין משימות כאן.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => onToggle(t.id)}
                className="accent-emerald-600 shrink-0"
              />
              <span className={`flex-1 min-w-0 truncate ${t.done ? 'line-through text-slate-400' : ''}`}>
                {t.title}
              </span>
              {t.scope === 'date' && t.dueDate && (
                <span className="text-xs text-slate-400 shrink-0">{t.dueDate}</span>
              )}
              {t.memberId && memberById[t.memberId] && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: memberById[t.memberId].color }}
                  title={memberById[t.memberId].name}
                />
              )}
              <button
                onClick={() => onRemove(t.id)}
                className="text-slate-400 hover:text-rose-600 p-0.5 shrink-0"
                aria-label="מחק"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TasksSection() {
  const { data, addTask, toggleTask, removeTask } = useAppData();
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<TaskScope>('general');
  const [memberId, setMemberId] = useState<string>('');
  const [dueDate, setDueDate] = useState(todayIso());

  const memberById = Object.fromEntries(data.members.map((m) => [m.id, m]));

  const handleAdd = () => {
    if (!title.trim()) return;
    if (scope === 'date' && !dueDate) return;
    addTask(title, scope, memberId || undefined, scope === 'date' ? dueDate : undefined);
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
          <ListChecks size={20} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">משימות משפחתיות</h2>
          <p className="text-sm text-slate-500">
            נהלו משימות כלליות, לשבוע הקרוב, לחודש הקרוב, או ליום ספציפי.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCOPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setScope(id)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium border ${
                scope === id
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-slate-500">שם המשימה</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: לקנות מתנה ליום הולדת"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {scope === 'date' && (
            <div>
              <label className="text-xs text-slate-500">תאריך</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-500">אחראי (אופציונלי)</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">ללא</option>
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
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={16} />
          הוספת משימה
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SCOPE_GROUPS.map(({ id, title: groupTitle, icon }) => (
          <TaskGroup
            key={id}
            title={groupTitle}
            icon={icon}
            tasks={data.tasks
              .filter((t) => t.scope === id)
              .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))}
            memberById={memberById}
            onToggle={toggleTask}
            onRemove={removeTask}
          />
        ))}
      </div>
    </div>
  );
}
