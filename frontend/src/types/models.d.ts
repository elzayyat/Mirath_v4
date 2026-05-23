export interface Debt {
  id: string;
  creditor_name: string;
  debt_type: string;
  amount: number;
}

export interface FuneralExpense {
  id: string;
  expense_type: string;
  paid_by?: string;
}

export interface Will {
  id: string;
  beneficiary_name?: string;
  description?: string;
}