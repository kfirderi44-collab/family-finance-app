import { useState } from 'react';
import { useAppData, MEMBER_COLORS } from '../store/AppDataContext';
import { Trash2, Plus, Users } from 'lucide-react';

export default function MembersSection() {
  const { data, addMember, updateMember, removeMember, nextMemberColor } = useAppData();
  const [name, setName] = useState('');

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addMember(trimmed, nextMemberColor());
    setName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40">
          <Users size={20} className="text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">בני משפחה</h2>
          <p className="text-sm text-slate-500">
            נהלו את בני המשפחה שישתתפו במעקב ההכנסות, ההוצאות והחיסכון.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="שם בן/בת המשפחה"
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            <Plus size={16} />
            הוספה
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {data.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
          >
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: m.color }}
            />
            <input
              value={m.name}
              onChange={(e) => updateMember(m.id, { name: e.target.value })}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
            />
            <div className="flex gap-1">
              {MEMBER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateMember(m.id, { color: c })}
                  className="w-5 h-5 rounded-full border border-black/10"
                  style={{ backgroundColor: c }}
                  aria-label={`בחר צבע ${c}`}
                />
              ))}
            </div>
            {data.members.length > 1 && (
              <button
                onClick={() => removeMember(m.id)}
                className="text-slate-400 hover:text-rose-600 p-1"
                aria-label="מחק"
              >
                <Trash2 size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
