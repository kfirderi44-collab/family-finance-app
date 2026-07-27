export type TransactionType = 'income' | 'expense';

export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO date (yyyy-mm-dd)
  memberId: string;
  note?: string;
  recurringId?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  memberId: string;
  dayOfMonth: number; // 1-28
  active: boolean;
}

export type TaskScope = 'general' | 'week' | 'month';

export interface FamilyTask {
  id: string;
  title: string;
  scope: TaskScope;
  memberId?: string;
  done: boolean;
}

export interface Contribution {
  id: string;
  amount: number;
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  deadline?: string;
  contributions: Contribution[];
}

export interface AppData {
  members: Member[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Record<string, number>;
  expenseCategories: string[];
  recurringExpenses: RecurringExpense[];
  tasks: FamilyTask[];
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  'מזון',
  'דיור',
  'חשבונות',
  'תחבורה',
  'בריאות',
  'חינוך',
  'בילויים',
  'ביגוד',
  'חיסכון',
  'אחר',
] as const;

export const INCOME_CATEGORIES = [
  'משכורת',
  'עצמאי',
  'קצבה',
  'מתנה',
  'השקעות',
  'אחר',
] as const;
