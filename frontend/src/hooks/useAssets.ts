import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AssetType {
  id: string;
  name: string;
  category: string;
  name_en?: string;
  name_ar?: string;
  measurement_unit?: string;
  icon?: string;
}

export interface Asset {
  id: string;
  name: string;
  name_en?: string;
  total_value: number;
  asset_type_id?: string;
  quantity?: number;
  unit?: string;
  value_per_unit?: number;
  physical_location?: string;
  [key: string]: any;
}

export interface Debt { id: string; creditor_name: string; debt_type: string; amount: number; }
export interface FuneralExpense { id: string; expense_type: string; paid_by?: string; amount: number; }
export interface Will { id: string; beneficiary_name: string; description?: string; amount: number; }

const ASSET_TYPES: AssetType[] = [
  { id: 'Cash',          name: 'Cash',           category: 'Liquid',      name_en: 'Cash',           name_ar: 'نقد',          icon: '💵', measurement_unit: 'unit' },
  { id: 'RealEstate',    name: 'Real Estate',    category: 'Property',    name_en: 'Real Estate',    name_ar: 'عقار',         icon: '🏠', measurement_unit: 'unit' },
  { id: 'Gold',          name: 'Gold',           category: 'Metals',      name_en: 'Gold',           name_ar: 'ذهب',          icon: '🪙', measurement_unit: 'gram' },
  { id: 'Silver',        name: 'Silver',         category: 'Metals',      name_en: 'Silver',         name_ar: 'فضة',          icon: '⚪', measurement_unit: 'gram' },
  { id: 'Vehicle',       name: 'Vehicle',        category: 'Property',    name_en: 'Vehicle',        name_ar: 'مركبة',        icon: '🚗', measurement_unit: 'unit' },
  { id: 'BusinessShare', name: 'Business Share', category: 'Investment',  name_en: 'Business Share', name_ar: 'حصة تجارية',   icon: '📈', measurement_unit: 'share' },
  { id: 'Debt',          name: 'Debt',           category: 'Deduction',   name_en: 'Debt',           name_ar: 'دين',          icon: '📋', measurement_unit: 'unit' },
  { id: 'Other',         name: 'Other',          category: 'Other',       name_en: 'Other',          name_ar: 'أخرى',         icon: '📦', measurement_unit: 'unit' },
];

export function useAssetTypes() {
  return useQuery<AssetType[]>({
    queryKey: ['asset-types'],
    queryFn: async (): Promise<AssetType[]> => ASSET_TYPES,
  });
}

export function useCaseAssets(caseId: string | undefined) {
  return useQuery<Asset[]>({
    queryKey: ['case-assets', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const d = (await api.get<any>(`/cases/${caseId}/full`)).data;
      return d.assets ?? [];
    },
    enabled: !!caseId,
  });
}

export function useAddCaseAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: any) =>
      (await api.post(`/cases/${asset.case_id}/assets`, {
        type: asset.asset_type_id ?? 'Other',
        description: asset.name_en ?? asset.notes ?? 'Asset',
        value: Number(asset.value_per_unit ?? asset.total_value ?? 0) * Number(asset.quantity ?? 1),
        currency: asset.currency_code ?? 'USD',
        weight: asset.quantity,
        unit: asset.unit,
      })).data,
    onSuccess: (_: any, vars: any) => qc.invalidateQueries({ queryKey: ['case-assets', vars.case_id] }),
  });
}

export function useDeleteCaseAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, caseId }: { id: string; caseId: string }) => {
      await api.delete(`/assets/${id}`);
      return caseId;
    },
    onSuccess: (caseId) => qc.invalidateQueries({ queryKey: ['case-assets', caseId] }),
  });
}
