export interface Transaction {
  id: number;
  is_income: boolean;
  amount: number;
  organization: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  transactions: Transaction[];
}

export interface User {
  id: number;
  username: string;
}

export interface Stats {
  total_income: number;
  total_expense: number;
  balance: number;
}