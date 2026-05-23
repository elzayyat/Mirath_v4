import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { mockStore } from '@/lib/mockStore';
import type { DeceasedInfo, Heir, Madhab, CalculationResult } from '@/lib/inheritance';

export interface CaseRecord {
  id: string;
  caseNumber?: string;
  title: string;
  deceased_name?: string;
  deceased_gender?: string;
  total_estate?: number;
  debts?: number;
  funeral_expenses?: number;
  bequests?: number;
  madhab?: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lastResult?: any;
}

const STANDALONE = import.meta.env.VITE_STANDALONE_MODE === 'true' || !import.meta.env.VITE_API_URL;

const normalizeMock = (c: any): CaseRecord => ({
  id: c.id,
  caseNumber: c.caseNumber,
  title: c.title,
  status: c.status,
  notes: c.notes ?? null,
  created_at: c.createdAt,
  updated_at: c.updatedAt ?? c.createdAt,
  deceased_name: c.deceased_name ?? c.decedent?.name ?? '',
  deceased_gender: c.deceased_gender ?? 'male',
  total_estate: c.total_estate ?? 0,
  debts: c.debts ?? 0,
  funeral_expenses: c.funeral_expenses ?? 0,
  bequests: c.bequests ?? 0,
  madhab: c.madhab ?? 'hanafi',
  lastResult: c.lastResult,
});

export function useCases() {
  const { user } = useAuth();
  return useQuery<CaseRecord[]>({
    queryKey: ['cases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      if (STANDALONE) return mockStore.getCases(user.id).map(normalizeMock).reverse();
      const d = (await api.get<any>('/cases')).data;
      return (d.items ?? d.data ?? d ?? []).map(normalizeMock);
    },
    enabled: !!user,
  });
}

export function useAllCases() {
  const { user } = useAuth();
  return useQuery<CaseRecord[]>({
    queryKey: ['all-cases'],
    queryFn: async () => {
      if (!user || user.role !== 'Admin') return [];
      if (STANDALONE) return mockStore.getAllCases().map(normalizeMock).reverse();
      const d = (await api.get<any>('/admin/cases')).data;
      return (d.items ?? d.data ?? d ?? []).map(normalizeMock);
    },
    enabled: !!user && user.role === 'Admin',
  });
}

export function useCase(caseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      if (!caseId || !user) return null;
      if (STANDALONE) {
        const c = mockStore.getCase(caseId);
        if (!c) return null;
        return { case: normalizeMock(c), heirs: c.heirs, assets: c.assets };
      }
      const d = (await api.get<any>(`/cases/${caseId}/full`)).data;
      return {
        case: normalizeMock({ ...d.case, decedent: d.decedent, assets: d.assets }),
        heirs: (d.heirs ?? []).map((h: any) => ({ id: h.id, relationship: h.relationship, count: h.count ?? 1, name: h.name })),
        assets: d.assets ?? [],
      };
    },
    enabled: !!user && !!caseId,
  });
}

export function useSaveCase() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ deceased, heirs, madhab, title, result, assets }: {
      deceased: DeceasedInfo;
      heirs: Heir[];
      madhab: Madhab;
      title: string;
      result?: CalculationResult;
      assets?: any[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      if (STANDALONE) {
        const c = mockStore.createCase(user.id, title, {
          deceased_name: deceased.name,
          deceased_gender: deceased.gender,
          total_estate: deceased.totalEstate,
          debts: deceased.debts,
          funeral_expenses: deceased.funeralExpenses,
          bequests: deceased.bequests,
          madhab,
        } as Partial<import('@/lib/mockStore').MockCase>);
        if (result) {
          const mockAssets = (assets ?? []).map((a, i) => ({
            id: a.id ?? String(i),
            caseId: c.id,
            type: a.typeId,
            description: a.description,
            value: a.value,
            currency: a.currency,
          }));
          mockStore.saveResult(c.id, result, deceased, heirs, madhab, mockAssets);
        }
        // Update subscription count
        const users = JSON.parse(localStorage.getItem('mirath_mock_users') || '[]');
        const idx = users.findIndex((u: { id: string }) => u.id === user.id);
        if (idx >= 0 && users[idx].subscription) {
          users[idx].subscription.casesUsedThisPeriod = (users[idx].subscription.casesUsedThisPeriod || 0) + 1;
          localStorage.setItem('mirath_mock_users', JSON.stringify(users));
        }
        return c.id;
      }
      const caseId = (await api.post<any>('/cases', {
        title, status: result ? 'Calculated' : 'Draft', notes: '',
        decedent: { name: deceased.name, deathDate: new Date().toISOString(), religion: 'Muslim', maritalStatus: 'Married' },
      })).data.id;
      for (const h of heirs) {
        await api.post(`/cases/${caseId}/heirs`, { name: h.name ?? h.type, relationship: h.type, isAlive: true, hasChildren: false, gender: 'Male', count: h.count });
      }
      return caseId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      qc.invalidateQueries({ queryKey: ['all-cases'] });
    },
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId: string) => {
      if (STANDALONE) { mockStore.deleteCase(caseId); return; }
      await api.delete(`/cases/${caseId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      qc.invalidateQueries({ queryKey: ['all-cases'] });
    },
  });
}
