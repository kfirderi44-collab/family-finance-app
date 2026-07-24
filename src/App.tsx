import { useState } from 'react';
import { AppDataProvider } from './store/AppDataContext';
import Dashboard from './components/Dashboard';
import TransactionsSection from './components/TransactionsSection';
import GoalsSection from './components/GoalsSection';
import MembersSection from './components/MembersSection';
import Reports from './components/Reports';
import { LayoutDashboard, Receipt, PiggyBank, Users, BarChart3, Wallet } from 'lucide-react';

type Tab = 'dashboard' | 'transactions' | 'goals' | 'members' | 'reports';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'סקירה', icon: LayoutDashboard },
  { id: 'transactions', label: 'הכנסות והוצאות', icon: Receipt },
  { id: 'goals', label: 'יעדי חיסכון', icon: PiggyBank },
  { id: 'reports', label: 'דוחות', icon: BarChart3 },
  { id: 'members', label: 'בני משפחה', icon: Users },
];

function AppShell() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <Wallet className="text-indigo-600 dark:text-indigo-400" size={28} />
          <h1 className="text-lg font-bold">תכנון פיננסי משפחת דראי</h1>
        </div>
        <nav className="max-w-5xl mx-auto px-2 flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
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
        {tab === 'reports' && <Reports />}
        {tab === 'members' && <MembersSection />}
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
