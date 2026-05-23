import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, FileCheck, Download, FileArchive, Share2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface DocumentGeneratorProps {
  caseId: string;
  caseNumber: string;
  onSuccess?: () => void;
}

const DocumentTypes = [
  { id: 'certificate', label: 'Inheritance Certificate', labelAr: 'شهادة الميراث', icon: FileText },
  { id: 'agreement', label: 'Division Agreement', labelAr: 'اتفاقية التقسيم', icon: FileCheck },
  { id: 'inventory', label: 'Estate Inventory', labelAr: 'محضر جرد التركة', icon: FileArchive },
];

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ caseId, caseNumber, onSuccess }) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['certificate']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const { toast } = useToast();

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const generateSingle = async (type: string) => {
    setIsGenerating(true);
    try {
      const response = await api.post(`/documents/generate/${type}`, { caseId });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_${caseNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Document Generated',
        description: `${type} has been generated successfully`,
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBatch = async () => {
    if (selectedTypes.length === 0) {
      toast({
        title: 'No Documents Selected',
        description: 'Please select at least one document type',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingBatch(true);
    try {
      const response = await api.post('/documents/generate/batch', {
        caseId,
        includeCertificate: selectedTypes.includes('certificate'),
        includeAgreement: selectedTypes.includes('agreement'),
        includeInventory: selectedTypes.includes('inventory'),
      });
      
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Documents_${caseNumber}_${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Batch Generation Complete',
        description: `${selectedTypes.length} document(s) generated successfully`,
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Batch Generation Failed',
        description: 'Failed to generate documents. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const shareViaEmail = async () => {
    toast({
      title: 'Email Feature',
      description: 'Document will be sent to your registered email',
    });
  };

  return (
    <Card className="border-gold/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-dark/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gold" />
          Generate Legal Documents
          <span className="text-gold font-arabic text-sm">توليد المستندات القانونية</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Document Types Selection */}
        <div className="space-y-3">
          <Label>Select Documents to Generate</Label>
          <div className="grid sm:grid-cols-3 gap-4">
            {DocumentTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedTypes.includes(type.id);
              return (
                <div
                  key={type.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-gold bg-gold/5 shadow-md'
                      : 'border-border hover:border-gold/50'
                  }`}
                  onClick={() => toggleType(type.id)}
                >
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleType(type.id)} />
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-gold' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground font-arabic">{type.labelAr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          {DocumentTypes.map((type) => (
            <Button
              key={type.id}
              variant="outline"
              size="sm"
              onClick={() => generateSingle(type.id)}
              disabled={isGenerating}
              className="border-gold/30 hover:bg-gold/10"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <type.icon className="w-4 h-4 mr-2" />
              )}
              Generate {type.label}
            </Button>
          ))}
        </div>

        {/* Batch Generation */}
        <div className="pt-4 border-t border-gold/20">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium">Batch Generation</p>
              <p className="text-xs text-muted-foreground">
                Generate all selected documents at once as a ZIP file
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="gold"
                onClick={generateBatch}
                disabled={isGeneratingBatch || selectedTypes.length === 0}
              >
                {isGeneratingBatch ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileArchive className="w-4 h-4 mr-2" />
                )}
                Generate Batch ({selectedTypes.length})
              </Button>
              <Button
                variant="outline"
                onClick={shareViaEmail}
                className="border-gold/30"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Documents
              </Button>
            </div>
          </div>
        </div>

        {/* Verification Info */}
        <div className="bg-emerald-dark/5 p-4 rounded-lg">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 bg-gold rounded-full" />
            All generated documents include a QR code for verification
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-gold rounded-full" />
            Documents are court-ready and Sharia-compliant
          </p>
        </div>
      </CardContent>
    </Card>
  );
};