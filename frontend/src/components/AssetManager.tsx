import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Package from 'lucide-react/dist/esm/icons/package';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { useAssetTypes, useCaseAssets, useAddCaseAsset, useDeleteCaseAsset } from '@/hooks/useAssets';
import { useToast } from '@/hooks/use-toast';
import { AssetType, Asset } from '@/hooks/useAssets';

interface Props {
  caseId: string;
}

const CATEGORIES: Record<string, { label: string; labelAr: string }> = {
  currency: { label: 'Currency & Banking', labelAr: 'نقود وبنوك' },
  metal: { label: 'Gold & Precious Metals', labelAr: 'ذهب ومعادن ثمينة' },
  real_estate: { label: 'Real Estate', labelAr: 'عقارات' },
  vehicle: { label: 'Vehicles', labelAr: 'مركبات' },
  business: { label: 'Business Assets', labelAr: 'أصول تجارية' },
  personal: { label: 'Personal Property', labelAr: 'ممتلكات شخصية' },
  digital: { label: 'Digital Assets', labelAr: 'أصول رقمية' },
  other: { label: 'Other', labelAr: 'أخرى' },
};

const AssetManager = ({ caseId }: Props) => {
  const { data: assetTypes } = useAssetTypes();
  const { data: assets, isLoading } = useCaseAssets(caseId);
  const addAsset = useAddCaseAsset();
  const deleteAsset = useDeleteCaseAsset();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [valuePerUnit, setValuePerUnit] = useState(0);
  const [location, setLocation] = useState('');

  const filteredTypes = assetTypes?.filter((t: AssetType) => !selectedCategory || t.category === selectedCategory) || [];
  const selectedType = assetTypes?.find((t: AssetType) => t.id === selectedTypeId);
  const totalValue = assets?.reduce((sum: number, a: Asset) => sum + Number(a.total_value || 0), 0) || 0;

  const handleAdd = async () => {
    if (!selectedTypeId || valuePerUnit <= 0) return;
    try {
      await addAsset.mutateAsync({
        case_id: caseId,
        asset_type_id: selectedTypeId,
        name_en: name || selectedType?.name_en || '',
        name_ar: selectedType?.name_ar || '',
        quantity,
        unit: selectedType?.measurement_unit || 'unit',
        value_per_unit: valuePerUnit,
        physical_location: location || undefined,
      });
      toast({ title: 'Asset added' });
      setShowForm(false);
      resetForm();
    } catch {
      toast({ title: 'Failed to add asset', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setSelectedCategory('');
    setSelectedTypeId('');
    setName('');
    setQuantity(1);
    setValuePerUnit(0);
    setLocation('');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAsset.mutateAsync({ id, caseId });
      toast({ title: 'Asset removed' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-arabic text-xl flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            Assets <span className="text-accent text-sm font-normal">الأصول</span>
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">${totalValue.toLocaleString()}</span>
            </span>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Asset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-lg border border-accent/20 bg-accent/5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category (الفئة)</Label>
                <Select value={selectedCategory} onValueChange={v => { setSelectedCategory(v); setSelectedTypeId(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label} ({v.labelAr})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Asset Type (نوع الأصل)</Label>
                <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {filteredTypes.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.icon} {t.name_en} ({t.name_ar})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name / Description</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main house in Dubai" />
              </div>
              <div className="space-y-2">
                <Label>Quantity ({selectedType?.measurement_unit || 'units'})</Label>
                <Input type="number" min={0.01} step={0.01} value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 1)} />
              </div>
              <div className="space-y-2">
                <Label>Value per unit ($)</Label>
                <Input type="number" min={0} step={0.01} value={valuePerUnit || ''} onChange={e => setValuePerUnit(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location (optional)</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Physical location" />
            </div>
            {valuePerUnit > 0 && (
              <div className="text-sm text-muted-foreground">
                Total value: <span className="font-semibold text-foreground">${(quantity * valuePerUnit).toLocaleString()}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!selectedTypeId || valuePerUnit <= 0 || addAsset.isPending}>
                {addAsset.isPending ? 'Adding...' : 'Add'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading assets...</div>
        ) : !assets?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No assets added yet
          </div>
        ) : (
          <div className="space-y-2">
            {assets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{(asset as any).asset_types?.icon || '📦'}</span>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {asset.name_en || (asset as any).asset_types?.name_en || 'Unnamed'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {asset.quantity} {asset.unit} × ${Number(asset.value_per_unit || 0).toLocaleString()}
                      {asset.physical_location && ` • ${asset.physical_location}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-foreground">
                    ${Number(asset.total_value || 0).toLocaleString()}
                  </span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(asset.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetManager;
