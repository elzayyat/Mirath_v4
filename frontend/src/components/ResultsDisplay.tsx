import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, BookOpen, AlertTriangle, CheckCircle, Scale } from 'lucide-react';
import type { CalculationResult, DeceasedInfo, Heir, Madhab } from '@/lib/inheritance';
import SharesPieChart from '@/components/SharesPieChart';
import SaveCaseButton from '@/components/SaveCaseButton';
import CalculationSteps from '@/components/CalculationSteps';
import PDFDownloadButton from '@/components/PDFDownloadButton';

interface Props {
  result: CalculationResult;
  deceased: DeceasedInfo;
  heirs: Heir[];
  madhab: Madhab;
  onBack: () => void;
  onReset: () => void;
}

const madhabLabels: Record<Madhab, string> = {
  jumhur: 'Jumhur (Majority)',
  hanafi: 'Hanafi',
  shafii: "Shafi'i",
  maliki: 'Maliki',
  hanbali: 'Hanbali',
};

const shareTypeLabels: Record<string, { label: string; className: string }> = {
  fard: { label: 'Fard (فرض)', className: 'bg-primary/10 text-primary border-primary/20' },
  asaba: { label: 'Asaba (عصبة)', className: 'bg-accent/10 text-accent border-accent/20' },
  fard_asaba: { label: 'Fard + Asaba', className: 'bg-primary/10 text-primary border-primary/20' },
  blocked: { label: 'Blocked (محجوب)', className: 'bg-muted text-muted-foreground' },
};

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ResultsDisplay = ({ result, deceased, heirs, madhab, onBack, onReset }: Props) => {
  const activeShares = result.shares.filter(s => !s.blocked);
  const blockedShares = result.shares.filter(s => s.blocked);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-arabic text-2xl flex items-center gap-3">
            Inheritance Results
            <span className="text-accent text-base font-normal">نتائج الميراث</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Total Estate</p>
              <p className="text-lg font-semibold text-foreground">{fmt(deceased.totalEstate)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Deductions</p>
              <p className="text-lg font-semibold text-foreground">{fmt(deceased.debts + deceased.funeralExpenses + deceased.bequests)}</p>
            </div>
            <div className="p-4 rounded-lg emerald-gradient">
              <p className="text-xs text-primary-foreground/70">Distributable</p>
              <p className="text-lg font-semibold text-primary-foreground">{fmt(result.distributableEstate)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Madhab</p>
              <p className="text-lg font-semibold text-foreground">{madhabLabels[madhab]}</p>
            </div>
          </div>

          {/* Special case badge */}
          {result.specialCase && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">{result.specialCase}</p>
              </div>
              {result.specialCaseAr && (
                <p className="text-xs text-muted-foreground font-arabic mt-1" dir="rtl">{result.specialCaseAr}</p>
              )}
            </div>
          )}

          {/* Notes */}
          {result.notes.length > 0 && (
            <div className="mb-6 space-y-2">
              {result.notes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <AlertTriangle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{note}</p>
                    {result.notesAr?.[i] && (
                      <p className="text-xs text-muted-foreground font-arabic mt-1" dir="rtl">{result.notesAr[i]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(result.awlApplied || result.raddApplied) && (
            <div className="flex gap-2 mb-6">
              {result.awlApplied && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                  Awl (عول) Applied
                </span>
              )}
              {result.raddApplied && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                  Radd (رد) Applied
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step-by-step Explanation */}
      {result.steps && result.steps.length > 0 && (
        <CalculationSteps steps={result.steps} />
      )}

      {/* Pie Chart */}
      <SharesPieChart shares={result.shares} distributableEstate={result.distributableEstate} />

      {/* Active Shares */}
      <Card>
        <CardHeader>
          <CardTitle className="font-arabic text-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Heir Shares
            <span className="text-accent text-sm font-normal">أنصبة الورثة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeShares.map((share, i) => {
              const percentage = result.distributableEstate > 0 ? (share.amount / result.distributableEstate) * 100 : 0;
              const typeInfo = shareTypeLabels[share.shareType] || shareTypeLabels.fard;
              return (
                <div key={i} className="p-4 rounded-lg border border-border hover:border-accent/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{share.heir.name}</span>
                      {share.heir.count > 1 && (
                        <span className="text-muted-foreground text-sm">×{share.heir.count}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeInfo.className}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{fmt(share.amount)}</p>
                      {share.heir.count > 1 && (
                        <p className="text-xs text-muted-foreground">({fmt(share.amount / share.heir.count)} each)</p>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full emerald-gradient transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-start justify-between text-xs gap-4">
                    <div className="max-w-[60%]">
                      <p className="text-muted-foreground">{share.explanation}</p>
                      {share.explanationAr && (
                        <p className="text-muted-foreground font-arabic text-right mt-1" dir="rtl">{share.explanationAr}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-accent font-medium">{percentage.toFixed(1)}% — {share.fraction}</p>
                      {share.quranicRef && (
                        <p className="text-muted-foreground flex items-center gap-1 mt-0.5 justify-end">
                          <BookOpen className="w-3 h-3" />
                          {share.quranicRef}
                        </p>
                      )}
                      {share.quranicText && (
                        <p className="text-muted-foreground font-arabic text-[10px] mt-0.5" dir="rtl">{share.quranicText}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Blocked Heirs */}
      {blockedShares.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-arabic text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              Blocked Heirs (Hajb)
              <span className="text-muted-foreground text-sm font-normal">المحجوبون</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blockedShares.map((share, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground">{share.heir.name}</span>
                    <span className="text-xs text-muted-foreground">{share.blockReason}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{share.explanation}</p>
                  {share.blockReasonAr && (
                    <p className="text-xs text-muted-foreground font-arabic mt-0.5" dir="rtl">{share.blockReasonAr}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Edit Heirs
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <PDFDownloadButton result={result} deceased={deceased} heirs={heirs} madhab={madhab} />
          <SaveCaseButton deceased={deceased} heirs={heirs} madhab={madhab} result={result} />
          <Button onClick={onReset} className="gold-gradient text-emerald-dark font-semibold hover:opacity-90">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Calculation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
