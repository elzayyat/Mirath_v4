import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save } from 'lucide-react';
import { useSaveCase } from '@/hooks/useCases';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { DeceasedInfo, Heir, Madhab, CalculationResult } from '@/lib/inheritance';

interface Props {
  deceased: DeceasedInfo;
  heirs: Heir[];
  madhab: Madhab;
  result?: CalculationResult;
}

const SaveCaseButton = ({ deceased, heirs, madhab, result }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(deceased.name ? `Case: ${deceased.name}` : 'Untitled Case');
  const { user } = useAuth();
  const saveCase = useSaveCase();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSave = async () => {
    try {
      const caseId = await saveCase.mutateAsync({ deceased, heirs, madhab, title, result });
      toast({ title: 'Case saved!', description: 'You can find it in your dashboard.' });
      setOpen(false);
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-accent/30 text-accent hover:bg-accent/10">
          <Save className="w-4 h-4 mr-2" />
          Save Case
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-arabic">Save Case</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input
            placeholder="Case title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Button
            onClick={handleSave}
            className="w-full gold-gradient text-emerald-dark font-semibold"
            disabled={saveCase.isPending}
          >
            {saveCase.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveCaseButton;
