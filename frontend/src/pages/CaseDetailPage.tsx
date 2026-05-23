import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Calculator, Trash2, ChevronDown, ChevronUp, 
  Printer, AlertCircle, CheckCircle2, Package 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCase, useDeleteCase } from '@/hooks/useCases';
import { useTranslation } from 'react-i18next';
import { useNumbers } from '@/contexts/NumberContext';
import { useToast } from '@/hooks/use-toast';
import { AVAILABLE_HEIRS, calculateInheritance, type Heir, type DeceasedInfo } from '@/lib/inheritance';
import { ASSET_TYPES } from '@/lib/assetTypes';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockStore } from '@/lib/mockStore';

const PIE_COLORS = ['#c9a84c','#1e4d8c','#2d8a5a','#c0392b','#8e44ad','#16a085','#d35400','#2c3e50','#27ae60'];

const CaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { formatNumber } = useNumbers();
  const { toast } = useToast();
  const isRtl = i18n.language === 'ar';
  const { data, isLoading } = useCase(id);
  const deleteCase = useDeleteCase();

  const [deductionOpen, setDeductionOpen] = useState(true);
  const [blockedOpen, setBlockedOpen] = useState(false);

  if (isLoading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mt-8" /></div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 text-center px-4">
        <p className="text-muted-foreground">{isRtl ? 'القضية غير موجودة' : 'Case not found.'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/client')}>
          {isRtl ? 'العودة' : 'Back'}
        </Button>
      </div><Footer />
    </div>
  );

  const { case: caseData, heirs = [], assets = [] } = data;

  // Compute total estate values
  const assetTotal = (assets ?? []).reduce((s, a) => s + (a.value || 0), 0);
  const effectiveTotalEstate = caseData.total_estate ?? 0;
  const manualEstate = Math.max(0, effectiveTotalEstate - assetTotal);

  // Build heir list from case data
  const heirsList: Heir[] = (heirs ?? []).map(h => ({
    id: h.id,
    type: (h.relationship ?? h.type) as any,
    name: h.name,
    count: h.count ?? 1,
  }));

  // Build deceased info
  const deceased: DeceasedInfo = {
    name: caseData.deceased_name || 'Unknown',
    gender: (caseData.deceased_gender as 'male'|'female') ?? 'male',
    totalEstate: effectiveTotalEstate,
    debts: caseData.debts ?? 0,
    funeralExpenses: caseData.funeral_expenses ?? 0,
    bequests: caseData.bequests ?? 0,
  };

  // Re-run calculation if we have heirs
  const result = heirsList.length > 0
    ? calculateInheritance(deceased, heirsList, (caseData.madhab as any) ?? 'hanafi')
    : null;

  const handleDelete = async () => {
    if (!confirm(isRtl ? 'هل تريد حذف هذه القضية؟' : 'Delete this case?')) return;
    await deleteCase.mutateAsync(id!);
    toast({ title: isRtl ? 'تم الحذف' : 'Deleted' });
    navigate('/client');
  };

  const activeShares = result?.shares.filter(s => !s.blocked && s.amount > 0) ?? [];
  const blockedShares = result?.shares.filter(s => s.blocked) ?? [];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              {isRtl ? <ArrowLeft className="w-4 h-4 rotate-180" /> : <ArrowLeft className="w-4 h-4" />}
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-heading truncate">{caseData.title}</h1>
              {caseData.caseNumber && <p className="text-muted-foreground text-sm">{caseData.caseNumber}</p>}
            </div>
            <Badge variant="outline">{caseData.status}</Badge>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Case Info Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="luxury-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{isRtl ? 'المتوفى' : 'Deceased'}</p>
                <p className="font-semibold">{deceased.name || '—'}</p>
                <p className="text-xs text-muted-foreground capitalize">{deceased.gender === 'male' ? (isRtl ? 'ذكر' : 'Male') : (isRtl ? 'أنثى' : 'Female')}</p>
              </CardContent>
            </Card>
            <Card className="luxury-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{isRtl ? 'التركة' : 'Estate'}</p>
                <p className="font-semibold text-xl">{formatNumber(effectiveTotalEstate)}</p>
                {assetTotal > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRtl ? `يتضمن أصول مضافة بقيمة ${formatNumber(assetTotal)}` : `includes assets worth ${formatNumber(assetTotal)}`}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="luxury-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('madhab')}</p>
                <p className="font-semibold capitalize">{caseData.madhab ?? 'Hanafi'}</p>
              </CardContent>
            </Card>
          </div>

          {/* No results yet */}
          {!result && (
            <Card className="luxury-card">
              <CardContent className="p-8 text-center">
                <Calculator className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">{isRtl ? 'لم يتم الحساب بعد' : 'No calculation yet'}</p>
                <Button className="gold-gradient text-navy" onClick={() => navigate('/calculator')}>
                  {isRtl ? 'احسب الآن' : 'Calculate Now'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Result details */}
          {result && (
            <div className="space-y-6">
              {/* Distributable estate total banner */}
              <Card className="luxury-card border-accent/30">
                <CardContent className="p-5 flex flex-wrap gap-6 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{isRtl ? 'صافي التوزيع' : 'Net Distributable'}</p>
                    <p className="text-3xl font-heading text-accent">{formatNumber(result.distributableEstate)}</p>
                  </div>
                  {result.awlApplied && <Badge variant="outline" className="text-amber-600 border-amber-500/30">Awl (عول)</Badge>}
                  {result.raddApplied && <Badge variant="outline" className="text-blue-600 border-blue-500/30">Radd (رد)</Badge>}
                </CardContent>
              </Card>

              {/* Asset breakdown */}
              {assets.length > 0 && (
                <Card className="luxury-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      <Package className="w-4 h-4 text-accent" />
                      {isRtl ? 'تفصيل الأصول' : 'Asset Breakdown'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {assets.map((asset) => {
                      const def = ASSET_TYPES.find(a => a.id === asset.type);
                      const pct = effectiveTotalEstate > 0 ? (asset.value / effectiveTotalEstate * 100).toFixed(1) : '0';
                      return (
                        <div key={asset.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span>{def?.icon ?? '📦'}</span>
                            <div>
                              <span className="font-medium">{isRtl ? def?.labelAr : def?.label}</span>
                              {asset.description && <span className="text-xs text-muted-foreground ms-2">({asset.description})</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">{formatNumber(asset.value)}</span>
                            <span className="text-muted-foreground w-12 text-end">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between pt-2 font-bold text-sm">
                      <span>{isRtl ? 'مجموع الأصول' : 'Assets Total'}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-accent">{formatNumber(assetTotal)}</span>
                        <span className="text-muted-foreground w-12 text-end">
                          {effectiveTotalEstate > 0 ? (assetTotal / effectiveTotalEstate * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Deduction summary */}
              <Card className="luxury-card overflow-hidden">
                <button
                  onClick={() => setDeductionOpen(o => !o)}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                  <h3 className="font-heading text-base">{isRtl ? 'ملخص الاستقطاعات' : 'Deduction Summary'}</h3>
                  {deductionOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground rotate-180" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {deductionOpen && (
                  <CardContent className="px-5 pb-5 space-y-2 text-sm border-t border-border pt-4">
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">{isRtl ? 'إجمالي التركة' : 'Gross Estate'}</span>
                      <span className="font-semibold">{formatNumber(effectiveTotalEstate)}</span>
                    </div>
                    {deceased.funeralExpenses > 0 && (
                      <div className="flex justify-between py-1 text-muted-foreground">
                        <span>− {isRtl ? 'مصاريف الجنازة' : 'Funeral Expenses'}</span>
                        <span>({formatNumber(deceased.funeralExpenses)})</span>
                      </div>
                    )}
                    {deceased.debts > 0 && (
                      <div className="flex justify-between py-1 text-muted-foreground">
                        <span>− {isRtl ? 'الديون' : 'Debts'}</span>
                        <span>({formatNumber(deceased.debts)})</span>
                      </div>
                    )}
                    {deceased.bequests > 0 && (
                      <div className="flex justify-between py-1 text-muted-foreground">
                        <span>− {isRtl ? 'الوصايا (محدودة بالثلث)' : 'Bequests (capped at 1/3)'}</span>
                        <span>({formatNumber(Math.min(deceased.bequests, Math.max(0, (effectiveTotalEstate - deceased.debts - deceased.funeralExpenses) / 3)))})</span>
                      </div>
                    )}
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between font-bold text-accent">
                      <span>{isRtl ? '= الصافي القابل للتوزيع' : '= Net Distributable'}</span>
                      <span>{formatNumber(result.distributableEstate)}</span>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Special Fiqh cases / rules */}
              {(result.awlApplied || result.raddApplied || result.specialCase) && (
                <Card className="luxury-card p-4 space-y-2">
                  {result.awlApplied && (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {isRtl ? 'تم تطبيق العول — الأنصبة تجاوزت 100%' : 'Awl applied — shares exceeded 100%, proportionally reduced'}
                    </div>
                  )}
                  {result.raddApplied && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {isRtl ? 'تم تطبيق الرد — الفائض أُعيد للورثة' : 'Radd applied — surplus returned to eligible heirs'}
                    </div>
                  )}
                  {result.specialCase && (
                    <div className="text-sm text-muted-foreground italic pl-6">
                      {isRtl ? result.specialCaseAr : result.specialCase}
                    </div>
                  )}
                </Card>
              )}

              {/* Shares Pie Chart */}
              {activeShares.length > 0 && (
                <Card className="luxury-card">
                  <CardHeader><CardTitle>{isRtl ? 'توزيع التركة' : 'Share Distribution'}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={activeShares}
                            dataKey="amount"
                            nameKey={s => isRtl ? AVAILABLE_HEIRS.find(d=>d.type===s.heir.type)?.labelAr ?? s.heir.name : s.heir.name}
                            outerRadius={100}
                            label={({ percent }) => `${(percent*100).toFixed(1)}%`}
                          >
                            {activeShares.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatNumber(Number(v))} labelFormatter={(_, payload) => payload?.[0]?.payload?.heir?.name ?? ''} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shares Table */}
              <Card className="luxury-card overflow-hidden">
                <CardHeader className="border-b border-border">
                  <CardTitle>{isRtl ? 'أنصبة الورثة' : 'Heir Shares'}</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-start py-3 px-4 text-xs uppercase tracking-wide text-muted-foreground">{isRtl ? 'الوارث' : 'Heir'}</th>
                        <th className="text-start py-3 px-4 text-xs uppercase tracking-wide text-muted-foreground">{t('fraction')}</th>
                        <th className="text-start py-3 px-4 text-xs uppercase tracking-wide text-muted-foreground">%</th>
                        <th className="text-start py-3 px-4 text-xs uppercase tracking-wide text-muted-foreground">{t('value')}</th>
                        <th className="text-start py-3 px-4 text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">{isRtl ? 'نصيب الفرد' : 'Per Person'}</th>
                        <th className="text-start py-3 px-4 text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">{isRtl ? 'البيان' : 'Basis'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeShares.map((s, idx) => {
                        const def = AVAILABLE_HEIRS.find(d => d.type === s.heir.type);
                        const isAsaba = s.shareType === 'asaba' || s.shareType === 'fard_then_asaba';
                        return (
                          <tr key={idx} className={`border-b border-border/50 transition-colors ${isAsaba ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-muted/20'}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                <span className="font-medium">{isRtl ? def?.labelAr : def?.label ?? s.heir.name}</span>
                                {s.heir.count > 1 && <span className="text-xs text-muted-foreground">×{s.heir.count}</span>}
                                {isAsaba && <span className="text-xs text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">{isRtl ? 'عصبة' : 'Asaba'}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs">{s.fraction}</td>
                            <td className="py-3 px-4 text-muted-foreground">{s.percentage.toFixed(2)}%</td>
                            <td className="py-3 px-4 font-semibold">{formatNumber(s.amount)}</td>
                            <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">
                              {s.perPersonAmount && s.heir.count > 1
                                ? <span className="text-accent">{formatNumber(s.perPersonAmount)} {isRtl ? '/فرد' : '/person'}</span>
                                : '—'}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell max-w-xs">
                              {s.quranicRef && (
                                <span title={s.quranicText ?? ''} className="text-accent me-1 cursor-help underline decoration-dotted">[{s.quranicRef}]</span>
                              )}
                              {isRtl ? s.explanationAr : s.explanation}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-accent/5 border-t border-accent/20">
                        <td className="py-3 px-4 font-bold">{isRtl ? 'الإجمالي' : 'Total'}</td>
                        <td colSpan={2} className="py-3 px-4 text-muted-foreground">100%</td>
                        <td className="py-3 px-4 font-bold text-accent">{formatNumber(result.distributableEstate)}</td>
                        <td className="hidden md:table-cell" />
                        <td className="hidden md:table-cell" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>

              {/* Blocked shares collapsible */}
              {blockedShares.length > 0 && (
                <Card className="luxury-card overflow-hidden">
                  <button
                    onClick={() => setBlockedOpen(o => !o)}
                    className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                    <h3 className="font-heading text-base text-muted-foreground">
                      {isRtl ? `الورثة المحجوبون (${blockedShares.length})` : `Blocked Heirs (${blockedShares.length})`}
                    </h3>
                    {blockedOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground rotate-180" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {blockedOpen && (
                    <div className="border-t border-border overflow-x-auto">
                      <table className="w-full text-sm">
                        <tbody>
                          {blockedShares.map((s, idx) => {
                            const def = AVAILABLE_HEIRS.find(d => d.type === s.heir.type);
                            return (
                              <tr key={idx} className="border-b border-border/50 opacity-60">
                                <td className="py-3 px-4 font-medium">{isRtl ? def?.labelAr : def?.label ?? s.heir.name}</td>
                                <td className="py-3 px-4 text-destructive text-xs">{isRtl ? '(محجوب)' : '(blocked)'}</td>
                                <td className="py-3 px-4 text-muted-foreground text-xs">{isRtl ? s.explanationAr : s.explanation}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}

              {/* Calculation steps */}
              <Card className="luxury-card p-5">
                <h3 className="font-heading text-lg mb-4">{isRtl ? 'خطوات الحساب' : 'Calculation Steps'}</h3>
                <div className="space-y-3">
                  {result.steps.map(s => (
                    <div key={s.stepNumber} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0 mt-0.5">{s.stepNumber}</div>
                      <div>
                        <p className="font-semibold text-sm">{isRtl ? s.titleAr : s.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{isRtl ? s.descriptionAr : s.description}</p>
                        {s.formula && <code className="text-xs text-accent bg-accent/8 px-2 py-0.5 rounded mt-1 inline-block">{s.formula}</code>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Scholar warning disclaimers */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground text-center">
                {isRtl
                  ? 'تنبيه: هذه الحسابات للأغراض التعليمية. يُرجى مراجعة عالم أو محامٍ مؤهل قبل أي قرار ملزم.'
                  : 'Disclaimer: These calculations are for educational purposes. Consult a qualified Islamic scholar or attorney before any binding decision.'}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/client')}>{isRtl ? 'العودة' : 'Back to Cases'}</Button>
            <Button className="gold-gradient text-navy" onClick={() => navigate('/calculator')}>
              <Calculator className="w-4 h-4 me-2" />{isRtl ? 'حساب جديد' : 'New Calculation'}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 me-2" />{isRtl ? 'طباعة' : 'Print / PDF'}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CaseDetailPage;
