import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCaseDebts(caseId: string | undefined) { return useQuery({ queryKey:['case-debts', caseId], queryFn:async()=>[], enabled:!!caseId }); }
export function useAddDebt() { const qc=useQueryClient(); return useMutation({ mutationFn: async (debt:any)=>debt, onSuccess:(_:any, vars:any)=>qc.invalidateQueries({queryKey:['case-debts', vars.case_id]}) }); }
export function useDeleteDebt() { const qc=useQueryClient(); return useMutation({ mutationFn: async ({caseId}:{id:string;caseId:string})=>caseId, onSuccess:(caseId)=>qc.invalidateQueries({queryKey:['case-debts', caseId]}) }); }
export function useCaseFuneralExpenses(caseId: string | undefined) { return useQuery({ queryKey:['funeral-expenses', caseId], queryFn:async()=>[], enabled:!!caseId }); }
export function useAddFuneralExpense() { const qc=useQueryClient(); return useMutation({ mutationFn: async (expense:any)=>expense, onSuccess:(_:any, vars:any)=>qc.invalidateQueries({queryKey:['funeral-expenses', vars.case_id]}) }); }
export function useDeleteFuneralExpense() { const qc=useQueryClient(); return useMutation({ mutationFn: async ({caseId}:{id:string;caseId:string})=>caseId, onSuccess:(caseId)=>qc.invalidateQueries({queryKey:['funeral-expenses', caseId]}) }); }
export function useCaseWills(caseId: string | undefined) { return useQuery({ queryKey:['wills', caseId], queryFn:async()=>[], enabled:!!caseId }); }
export function useAddWill() { const qc=useQueryClient(); return useMutation({ mutationFn: async (will:any)=>will, onSuccess:(_:any, vars:any)=>qc.invalidateQueries({queryKey:['wills', vars.case_id]}) }); }
export function useDeleteWill() { const qc=useQueryClient(); return useMutation({ mutationFn: async ({caseId}:{id:string;caseId:string})=>caseId, onSuccess:(caseId)=>qc.invalidateQueries({queryKey:['wills', caseId]}) }); }


// Backwards-compatible alias used by DebtWillManager.
export const useFuneralExpenses = useCaseFuneralExpenses;
