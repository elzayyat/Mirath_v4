import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, UserCheck, UserX, Users } from 'lucide-react';

import { useCaseHeirs, useAddHeir, useDeleteHeir } from '@/hooks/useHeirs';
import { useToast } from '@/hooks/use-toast';

interface Props {
  caseId: string;
  deceasedGender: string;
}

const RELATIONSHIP_TYPES = [
  { value: 'husband', label: 'Husband', labelAr: 'الزوج', gender: 'male', forDeceased: 'female' },
  { value: 'wife', label: 'Wife', labelAr: 'الزوجة', gender: 'female', forDeceased: 'male' },
  { value: 'son', label: 'Son', labelAr: 'الابن', gender: 'male' },
  { value: 'daughter', label: 'Daughter', labelAr: 'البنت', gender: 'female' },
  { value: 'father', label: 'Father', labelAr: 'الأب', gender: 'male' },
  { value: 'mother', label: 'Mother', labelAr: 'الأم', gender: 'female' },
  { value: 'full_brother', label: 'Full Brother', labelAr: 'الأخ الشقيق', gender: 'male' },
  { value: 'full_sister', label: 'Full Sister', labelAr: 'الأخت الشقيقة', gender: 'female' },
  { value: 'paternal_brother', label: 'Paternal Brother', labelAr: 'الأخ لأب', gender: 'male' },
  { value: 'paternal_sister', label: 'Paternal Sister', labelAr: 'الأخت لأب', gender: 'female' },
  { value: 'maternal_brother', label: 'Maternal Brother', labelAr: 'الأخ لأم', gender: 'male' },
  { value: 'maternal_sister', label: 'Maternal Sister', labelAr: 'الأخت لأم', gender: 'female' },
  { value: 'grandfather', label: 'Grandfather', labelAr: 'الجد', gender: 'male' },
  { value: 'grandmother', label: 'Grandmother', labelAr: 'الجدة', gender: 'female' },
  { value: 'sons_son', label: "Son's Son", labelAr: 'ابن الابن', gender: 'male' },
  { value: 'sons_daughter', label: "Son's Daughter", labelAr: 'بنت الابن', gender: 'female' },
] as const;

interface Heir {
  id: string;
  full_name: string;
  gender: 'male' | 'female';
  relationship_type: string;
  share_percentage: number | null;
  share_amount: number | null;
  is_excluded: boolean;
  exclusion_reason: string;
}

const HeirManager = ({ caseId, deceasedGender }: Props) => {
  const { data: heirs, isLoading } = useCaseHeirs(caseId);
  const addHeir = useAddHeir();
  const deleteHeir = useDeleteHeir();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');

  const availableRelationships = RELATIONSHIP_TYPES.filter((r) => {
    if ('forDeceased' in r && r.forDeceased && r.forDeceased !== deceasedGender) return false;
    return true;
  });

  const selectedRel = RELATIONSHIP_TYPES.find((r) => r.value === relationship);

  const handleAdd = async () => {
    if (!fullName.trim() || !relationship) return;
    try {
      await addHeir.mutateAsync({
        case_id: caseId,
        full_name: fullName.trim(),
        gender: selectedRel?.gender || 'male',
        relationship_type: relationship,
        phone_number: phone || undefined,
        email: email || undefined,
        national_id: nationalId || undefined,
      });
      toast({ title: 'Heir added' });
      setShowForm(false);
      setFullName('');
      setRelationship('');
      setPhone('');
      setEmail('');
      setNationalId('');
    } catch {
      toast({ title: 'Failed to add heir', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHeir.mutateAsync({ id, caseId });
      toast({ title: 'Heir removed' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const getRelLabel = (type: string) => {
    const rel = RELATIONSHIP_TYPES.find((item) => item.value === type);
    return rel ? `${rel.label} (${rel.labelAr})` : type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-arabic text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Heirs <span className="text-accent text-sm font-normal">الورثة</span>
          </CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Heir
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-lg border border-accent/20 bg-accent/5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name (الاسم الكامل) *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter heir's full name" />
              </div>
              <div className="space-y-2">
                <Label>Relationship (صلة القرابة) *</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                  <SelectContent>
                    {availableRelationships.map((rel) => (
                      <SelectItem key={rel.value} value={rel.value}>
                        {rel.label} ({rel.labelAr})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966..." />
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="heir@email.com" />
              </div>
              <div className="space-y-2">
                <Label>National ID (optional)</Label>
                <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!fullName.trim() || !relationship || addHeir.isPending}>
                {addHeir.isPending ? 'Adding...' : 'Add Heir'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading heirs...</div>
        ) : !heirs?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No heirs added yet
          </div>
        ) : (
          <div className="space-y-2">
            {heirs.map((heir: Heir) => (
              <div key={heir.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  {heir.is_excluded ? (
                    <UserX className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <UserCheck className="w-5 h-5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium text-sm text-foreground">{heir.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getRelLabel(heir.relationship_type)}
                      {heir.share_percentage !== null && (
                        <span className="ml-2 text-accent font-medium">{heir.share_percentage}%</span>
                      )}
                      {heir.is_excluded && (
                        <span className="ml-2 text-destructive">Excluded: {heir.exclusion_reason}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {heir.share_amount !== null && (
                    <span className="text-sm font-semibold text-foreground">${Number(heir.share_amount).toLocaleString()}</span>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(heir.id)}>
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

export default HeirManager;
