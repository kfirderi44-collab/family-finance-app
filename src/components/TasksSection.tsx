import { useState } from 'react';
import { useAppData } from '../store/AppDataContext';
import { todayIso } from '../utils/format';
import type { FamilyTask, TaskScope } from '../types';
import { ListChecks, CalendarDays, CalendarRange, Calendar, Plus, Trash2, Pencil, Check, X } from 'lucide-react';

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

interface EditState {
  title: string;
  scope: TaskScope;
  dueDate: string;
  memberId: string;
}

function TaskGroup({
  title,
  icon: Icon,
  tasks,
  members,
  memberById,
  editingId,
  editState,
  onEditFieldChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onRemove,
}: {
  title: string;
  icon: typeof ListChecks;
  tasks: FamilyTask[];
  members: { id: string; name: string; color: string }[];
  memberById: Record<string, { name: string; color: string }>;
  editingId: string | null;
  editState: EditState;
  onEditFieldChange: (updates: Partial<EditState>) => void;
  onStartEdit: (t: FamilyTask) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
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
          {tasks.map((t) =>
            editingId === t.id ? (
              <li
                key={t.id}
                className="rounded-lg border border-emerald-300 dark:border-emerald-700 p-2 space-y-2"
              >
                <input
                  value={editState.title}
                  onChange={(e) => onEditFieldChange({ title: e.target.value })}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex flex-wrap gap-1.5">
                  {SCOPES.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => onEditFieldChange({ scope: id })}
                      className={`px-2 py-1 rounded-md text-xs border ${
                        editState.scope === id
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border-slate-300 dark:border-slate-600 text-slate-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {editState.scope === 'date' && (
                  <input
                    type="date"
                    value={editState.dueDate}
                    onChange={(e) => onEditFieldChange({ dueDate: e.target.value })}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
                <select
                  value={editState.memberId}
                  onChange={(e) => onEditFieldChange({ memberId: e.target.value })}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">ללא אחראי</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={onSaveEdit}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md bg-emerald-600 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    <Check size={14} />
                    שמירה
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 py-1.5 text-xs text-slate-500"
                  >
                    <X size={14} />
                    ביטול
                  </button>
                </div>
              </li>
            ) : (
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
                  onClick={() => onStartEdit(t)}
                  className="text-slate-400 hover:text-emerald-600 p-0.5 shrink-0"
                  aria-label="ערוך"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onRemove(t.id)}
                  className="text-slate-400 hover:text-rose-600 p-0.5 shrink-0"
                  aria-label="מחק"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

export default function TasksSection() {
  const { data, addTask, updateTask, toggleTask, removeTask } = useAppData();
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<TaskScope>('general');
  const [memberId, setMemberId] = useState<string>('');
  const [dueDate, setDueDate] = useState(todayIso());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    title: '',
    scope: 'general',
    dueDate: todayIso(),
    memberId: '',
  });

  const memberById = Object.fromEntries(data.members.map((m) => [m.id, m]));

  const handleAdd = () => {
    if (!title.trim()) return;
    if (scope === 'date' && !dueDate) return;
    addTask(title, scope, memberId || undefined, scope === 'date' ? dueDate : undefined);
    setTitle('');
  };

  const startEdit = (t: FamilyTask) => {
    setEditingId(t.id);
    setEditState({
      title: t.title,
      scope: t.scope,
      dueDate: t.dueDate ?? todayIso(),
      memberId: t.memberId ?? '',
    });
  };

  const saveEdit = () => {
    if (!editingId || !editState.title.trim()) return;
    if (editState.scope === 'date' && !editState.dueDate) return;
    updateTask(editingId, {
      title: editState.title.trim(),
      scope: editState.scope,
      memberId: editState.memberId || undefined,
      dueDate: editState.scope === 'date' ? editState.dueDate : undefined,
    });
    setEditingId(null);
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
            members={data.members}
            memberById={memberById}
            editingId={editingId}
            editState={editState}
            onEditFieldChange={(updates) => setEditState((s) => ({ ...s, ...updates }))}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onToggle={toggleTask}
            onRemove={removeTask}
          />
        ))}
      </div>
    </div>
  );
}
