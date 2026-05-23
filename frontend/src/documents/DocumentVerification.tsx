import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Search, Shield } from 'lucide-react';
import { api } from '@/lib/api';

export const DocumentVerification = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    document?: any;
  } | null>(null);

  const verifyDocument = async () => {
    if (!verificationCode.trim()) return;
    
    setIsVerifying(true);
    try {
      const response = await api.get(`/documents/verify/${verificationCode}`);
      setVerificationResult({ valid: true, document: response.data.document });
    } catch (error) {
      setVerificationResult({ valid: false });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="border-gold/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gold" />
          Verify Document Authenticity
          <span className="text-gold font-arabic text-sm">التحقق من المستند</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder="Enter verification code (e.g., MIR-20241225-ABC12345)"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="flex-1 border-gold/20"
          />
          <Button onClick={verifyDocument} disabled={isVerifying} variant="gold">
            <Search className="w-4 h-4 mr-2" />
            Verify
          </Button>
        </div>

        {verificationResult && (
          <div className={`p-4 rounded-lg ${verificationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-3">
              {verificationResult.valid ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className={`font-semibold ${verificationResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                  {verificationResult.valid ? 'Document is Valid' : 'Document Not Found'}
                </p>
                {verificationResult.valid && verificationResult.document && (
                  <div className="mt-2 text-sm space-y-1">
                    <p>Case Number: {verificationResult.document.caseNumber}</p>
                    <p>Deceased: {verificationResult.document.deceasedName}</p>
                    <p>Generated: {new Date(verificationResult.document.generatedDate).toLocaleDateString()}</p>
                    <Badge className="mt-2 bg-green-100 text-green-700">Verified ✓</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Scan the QR code on any Mirath document or enter the verification code above
        </p>
      </CardContent>
    </Card>
  );
};