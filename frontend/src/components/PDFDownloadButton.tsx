import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CalculationResult, DeceasedInfo, Heir, Madhab } from '@/lib/inheritance';
import { getHeirLabel, getHeirLabelAr } from '@/lib/inheritance';

interface Props {
  result: CalculationResult;
  deceased: DeceasedInfo;
  heirs: Heir[];
  madhab: Madhab;
}

const PDFDownloadButton = ({ result, deceased, heirs, madhab }: Props) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setLoading(true);
    try {
      const rows = result.shares.map((s: any) => `<tr><td>${s.heirType ?? s.type}</td><td>${s.fraction}</td><td>${s.amount}</td></tr>`).join('');
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Mirath Report</title></head><body><h1>Mirath Inheritance Report</h1><p>Decedent: ${deceased.name}</p><p>Madhab: ${madhab}</p><table border="1" cellpadding="6"><tr><th>Heir</th><th>Fraction</th><th>Amount</th></tr>${rows}</table></body></html>`;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
        toast({ title: 'Report opened — use Print > Save as PDF' });
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      toast({ title: 'Failed to generate report', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
      Download PDF
    </Button>
  );
};

export default PDFDownloadButton;
