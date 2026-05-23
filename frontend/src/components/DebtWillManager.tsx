import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Landmark, Plus, ScrollText, Trash2 } from 'lucide-react';
import {
  useCaseDebts,
  useAddDebt,
  useFuneralExpenses,
  useCaseWills,
  useDeleteDebt,
  useAddFuneralExpense,
  useDeleteFuneralExpense,
  useAddWill,
  useDeleteWill,
} from '@/hooks/useDebtsWills';
import { useToast } from '@/hooks/use-toast';

interface Props {
  caseId: string;
  totalEstate: number;
}

interface Debt {
  id: string;
  creditor_name: string;
  debt_type?: string;
  amount: number;
}

interface FuneralExpense {
  id: string;
  expense_type?: string;
  amount: number;
  paid_by?: string;
}

interface Will {
  id: string;
  beneficiary_name?: string;
  amount?: number;
  description?: string;
}

const DEBT_TYPES = [
  { value: 'bank_loan', label: 'Bank Loan', labelAr: 'قرض بنكي' },
  { value: 'personal_loan', label: 'Personal Loan', labelAr: 'قرض شخصي' },
  { value: 'credit_card', label: 'Credit Card', labelAr: 'بطاقة ائتمان' },
  { value: 'mortgage', label: 'Mortgage', labelAr: 'رهن عقاري' },
  { value: 'unpaid_bills', label: 'Unpaid Bills', labelAr: 'فواتير غير مسددة' },
  { value: 'zakah', label: 'Unpaid Zakah', labelAr: 'زكاة غير مسددة' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
];

const DebtWillManager = ({ caseId, totalEstate }: Props) => {
  const { data: debts } = useCaseDebts(caseId);
  const { data: funeralExps } = useFuneralExpenses(caseId);
  const { data: wills } = useCaseWills(caseId);
  const addDebt = useAddDebt();
  const deleteDebt = useDeleteDebt();
  const addFuneral = useAddFuneralExpense();
  const deleteFuneral = useDeleteFuneralExpense();
  const addWill = useAddWill();
  const deleteWill = useDeleteWill();
  const { toast } = useToast();

  const [debtForm, setDebtForm] = useState({ show: false, creditor: '', type: 'other', amount: 0, description: '' });
  const [funeralForm, setFuneralForm] = useState({ show: false, type: '', amount: 0, description: '', paidBy: '' });
  const [willForm, setWillForm] = useState({ show: false, beneficiary: '', amount: 0, description: '' });

  const totalDebts = debts?.reduce((sum: number, debt: Debt) => sum + Number(debt.amount), 0) || 0;
  const totalFuneral = funeralExps?.reduce((sum: number, expense: FuneralExpense) => sum + Number(expense.amount), 0) || 0;
  const totalWills = wills?.reduce((sum: number, will: Will) => sum + Number(will.amount || 0), 0) || 0;
  const netAfterDeductions = totalEstate - totalDebts - totalFuneral;
  const maxWill = netAfterDeductions > 0 ? netAfterDeductions / 3 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-arabic text-xl flex items-center gap-2">
          <Landmark className="w-5 h-5 text-accent" />
          Deductions <span className="text-accent text-sm font-normal">الخصومات</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="debts">
          <TabsList className="mb-4">
            <TabsTrigger value="debts">Debts ({debts?.length || 0})</TabsTrigger>
            <TabsTrigger value="funeral">Funeral ({funeralExps?.length || 0})</TabsTrigger>
            <TabsTrigger value="wills">Wills ({wills?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="debts" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">${totalDebts.toLocaleString()}</span></span>
              <Button size="sm" onClick={() => setDebtForm((prev) => ({ ...prev, show: !prev.show }))}>
                <Plus className="w-4 h-4 mr-1" />Add Debt
              </Button>
            </div>
            {debtForm.show && (
              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Creditor Name *</Label>
                    <Input value={debtForm.creditor} onChange={(e) => setDebtForm((prev) => ({ ...prev, creditor: e.target.value }))} placeholder="Bank name or person" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={debtForm.type} onValueChange={(value) => setDebtForm((prev) => ({ ...prev, type: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEBT_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label} ({type.labelAr})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount *</Label>
                    <Input type="number" min={0} value={debtForm.amount || ''} onChange={(e) => setDebtForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!debtForm.creditor || debtForm.amount <= 0}
                    onClick={async () => {
                      await addDebt.mutateAsync({ case_id: caseId, creditor_name: debtForm.creditor, debt_type: debtForm.type, amount: debtForm.amount, description: debtForm.description });
                      toast({ title: 'Debt added' });
                      setDebtForm({ show: false, creditor: '', type: 'other', amount: 0, description: '' });
                    }}
                  >
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDebtForm((prev) => ({ ...prev, show: false }))}>Cancel</Button>
                </div>
              </div>
            )}
            {debts?.map((debt: Debt) => (
              <div key={debt.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm text-foreground">{debt.creditor_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{debt.debt_type?.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">${Number(debt.amount).toLocaleString()}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { deleteDebt.mutateAsync({ id: debt.id, caseId }); toast({ title: 'Debt removed' }); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="funeral" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">${totalFuneral.toLocaleString()}</span></span>
              <Button size="sm" onClick={() => setFuneralForm((prev) => ({ ...prev, show: !prev.show }))}>
                <Plus className="w-4 h-4 mr-1" />Add Expense
              </Button>
            </div>
            {funeralForm.show && (
              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Input value={funeralForm.type} onChange={(e) => setFuneralForm((prev) => ({ ...prev, type: e.target.value }))} placeholder="e.g. Burial, Shroud" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount *</Label>
                    <Input type="number" min={0} value={funeralForm.amount || ''} onChange={(e) => setFuneralForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Paid By</Label>
                    <Input value={funeralForm.paidBy} onChange={(e) => setFuneralForm((prev) => ({ ...prev, paidBy: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={funeralForm.amount <= 0}
                    onClick={async () => {
                      await addFuneral.mutateAsync({ case_id: caseId, expense_type: funeralForm.type, amount: funeralForm.amount, paid_by: funeralForm.paidBy, description: funeralForm.description });
                      toast({ title: 'Expense added' });
                      setFuneralForm({ show: false, type: '', amount: 0, description: '', paidBy: '' });
                    }}
                  >
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setFuneralForm((prev) => ({ ...prev, show: false }))}>Cancel</Button>
                </div>
              </div>
            )}
            {funeralExps?.map((expense: FuneralExpense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm text-foreground">{expense.expense_type || 'Funeral expense'}</p>
                  {expense.paid_by && <p className="text-xs text-muted-foreground">Paid by: {expense.paid_by}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">${Number(expense.amount).toLocaleString()}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { deleteFuneral.mutateAsync({ id: expense.id, caseId }); toast({ title: 'Expense removed' }); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="wills" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">${totalWills.toLocaleString()}</span>
                <span className="ml-2">(Max 1/3: ${maxWill.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
              </div>
              <Button size="sm" onClick={() => setWillForm((prev) => ({ ...prev, show: !prev.show }))}>
                <Plus className="w-4 h-4 mr-1" />Add Bequest
              </Button>
            </div>
            {totalWills > maxWill && maxWill > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-foreground">
                  Total bequests exceed the 1/3 limit. They will be proportionally reduced during calculation.
                </p>
              </div>
            )}
            {willForm.show && (
              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Beneficiary Name</Label>
                    <Input value={willForm.beneficiary} onChange={(e) => setWillForm((prev) => ({ ...prev, beneficiary: e.target.value }))} placeholder="Person or organization" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount *</Label>
                    <Input type="number" min={0} value={willForm.amount || ''} onChange={(e) => setWillForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={willForm.amount <= 0}
                    onClick={async () => {
                      await addWill.mutateAsync({
                        case_id: caseId,
                        beneficiary_name: willForm.beneficiary,
                        amount: willForm.amount,
                        description: willForm.description,
                      });
                      toast({ title: 'Bequest added' });
                      setWillForm({ show: false, beneficiary: '', amount: 0, description: '' });
                    }}
                  >
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setWillForm((prev) => ({ ...prev, show: false }))}>Cancel</Button>
                </div>
              </div>
            )}
            {wills?.map((will: Will) => (
              <div key={will.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    <ScrollText className="w-4 h-4 inline mr-1 text-accent" />
                    {will.beneficiary_name || 'Unnamed beneficiary'}
                  </p>
                  {will.description && <p className="text-xs text-muted-foreground">{will.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">${Number(will.amount || 0).toLocaleString()}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { deleteWill.mutateAsync({ id: will.id, caseId }); toast({ title: 'Bequest removed' }); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 rounded-lg bg-muted border border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Debts</span>
            <span className="text-foreground">${totalDebts.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Funeral Expenses</span>
            <span className="text-foreground">${totalFuneral.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bequests (Wasiyyah)</span>
            <span className="text-foreground">${totalWills.toLocaleString()}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
            <span>Net Estate</span>
            <span className="text-accent">${Math.max(0, totalEstate - totalDebts - totalFuneral - Math.min(totalWills, maxWill)).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebtWillManager;
