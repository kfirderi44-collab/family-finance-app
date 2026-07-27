import { useEffect, useState } from 'react';
import { AppDataProvider } from './store/AppDataContext';
import Dashboard from './components/Dashboard';
import TransactionsSection from './components/TransactionsSection';
import GoalsSection from './components/GoalsSection';
import MembersSection from './components/MembersSection';
import Reports from './components/Reports';
import SettingsSection from './components/SettingsSection';
import BudgetsSection from './components/BudgetsSection';
import RecurringExpensesSection from './components/RecurringExpensesSection';
import TasksSection from './components/TasksSection';
import { LayoutDashboard, Receipt, PiggyBank, Users, BarChart3, Wallet, Settings, Target, Repeat, ListChecks } from 'lucide-react';

type Tab = 'dashboard' | 'transactions' | 'goals' | 'budgets' | 'recurring' | 'tasks' | 'members' | 'reports' | 'settings';
type TabColor = 'teal' | 'sky' | 'violet' | 'amber' | 'fuchsia' | 'rose' | 'cyan' | 'indigo' | 'emerald';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard; color: TabColor }[] = [
  { id: 'dashboard', label: 'סקירה', icon: LayoutDashboard, color: 'teal' },
  { id: 'tasks', label: 'משימות משפחתיות', icon: ListChecks, color: 'emerald' },
  { id: 'transactions', label: 'הכנסות והוצאות', icon: Receipt, color: 'sky' },
  { id: 'budgets', label: 'תקציבים', icon: Target, color: 'violet' },
  { id: 'recurring', label: 'הוצאות קבועות', icon: Repeat, color: 'indigo' },
  { id: 'goals', label: 'יעדי חיסכון', icon: PiggyBank, color: 'amber' },
  { id: 'reports', label: 'דוחות', icon: BarChart3, color: 'fuchsia' },
  { id: 'members', label: 'בני משפחה', icon: Users, color: 'rose' },
  { id: 'settings', label: 'סנכרון', icon: Settings, color: 'cyan' },
];

const TAB_ACTIVE_CLASSES: Record<TabColor, string> = {
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
};

function AppShell() {
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    document.getElementById('splash')?.classList.add('hidden');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-sky-50 to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 shadow-sm">
            <Wallet className="text-white" size={20} />
          </div>
          <h1 className="text-lg font-bold">תכנון פיננסי משפחת דראי</h1>
        </div>
        <nav className="max-w-5xl mx-auto px-2 pb-2 flex gap-1.5 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                tab === id
                  ? TAB_ACTIVE_CLASSES[color]
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'transactions' && <TransactionsSection />}
        {tab === 'goals' && <GoalsSection />}
        {tab === 'budgets' && <BudgetsSection />}
        {tab === 'recurring' && <RecurringExpensesSection />}
        {tab === 'tasks' && <TasksSection />}
        {tab === 'reports' && <Reports />}
        {tab === 'members' && <MembersSection />}
        {tab === 'settings' && <SettingsSection />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  );
}
