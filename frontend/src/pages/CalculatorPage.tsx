import { useState, useEffect, useCallback } from 'react';
import { useSaveCase } from '@/hooks/useCases';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';
import { useNumbers } from '@/contexts/NumberContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Save,
  ChevronDown, ChevronUp, Package
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  AVAILABLE_HEIRS, calculateInheritance, validateHeirs,
  type HeirType, type Heir, type DeceasedInfo, type Madhab,
} from '@/lib/inheritance';
import { ASSET_TYPES } from '@/lib/assetTypes';

interface AssetEntry {
  id: string;
  typeId: string;
  description: string;
  value: number;
  currency: string;
  fields: Record<string, string | number>;
}

const PIE_COLORS = ['#c9a84c','#1e4d8c','#2d8a5a','#c0392b','#8e44ad','#16a085','#d35400','#2c3e50','#27ae60','#e74c3c','#f39c12'];

const STEPS = ['calculator.step1','calculator.step2','calculator.step3','calculator.step4','calculator.step5'];

const CalculatorPage = () => {
  const { t, i18n } = useTranslation();
  const { formatNumber } = useNumbers();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRtl = i18n.language === 'ar';
  const saveCase = useSaveCase();

  // Step state
  const [step, setStep] = useState(1);

  // Step 1 — Deceased
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedGender, setDeceasedGender] = useState<'male'|'female'>('male');
  const [totalEstate, setTotalEstate] = useState('');
  const [debts, setDebts] = useState('0');
  const [funeralExp, setFuneralExp] = useState('0');
  const [bequests, setBequests] = useState('0');

  // Step 2 — Heirs
  const [heirs, setHeirs] = useState<Heir[]>([]);

  // Step 3 — Assets
  const [assets, setAssets] = useState<AssetEntry[]>([]);

  // Step 4 — Madhab
  const [madhab, setMadhab] = useState<Madhab>('hanafi');

  // Step 5 collapsible sections
  const [deductionOpen, setDeductionOpen] = useState(true);
  const [blockedOpen, setBlockedOpen] = useState(false);

  // Results
  const [result, setResult] = useState<ReturnType<typeof calculateInheritance> | null>(null);
  const [validationError, setValidationError] = useState('');

  // Computed asset total & effective estate
  const assetTotal = assets.reduce((s, a) => s + (a.value || 0), 0);
  const step1Total = Number(totalEstate) || 0;
  const effectiveTotalEstate = step1Total + assetTotal;

  // Build deceased object using effectiveTotalEstate for calculation
  const deceased: DeceasedInfo = {
    name: deceasedName,
    gender: deceasedGender,
    totalEstate: effectiveTotalEstate,
    debts: Number(debts) || 0,
    funeralExpenses: Number(funeralExp) || 0,
    bequests: Number(bequests) || 0,
  };

  // Add heir
  const addHeir = (type: HeirType) => {
    const def = AVAILABLE_HEIRS.find(h => h.type === type);
    if (!def) return;
    const existing = heirs.find(h => h.type === type);
    if (existing) {
      if (def.maxCount && existing.count >= def.maxCount) return;
      setHeirs(heirs.map(h => h.type === type ? { ...h, count: h.count + 1 } : h));
    } else {
      setHeirs([...heirs, { id: type, type, name: isRtl ? def.labelAr : def.label, count: 1 }]);
    }
  };

  const removeHeir = (type: HeirType) => {
    const existing = heirs.find(h => h.type === type);
    if (!existing) return;
    if (existing.count <= 1) setHeirs(heirs.filter(h => h.type !== type));
    else setHeirs(heirs.map(h => h.type === type ? { ...h, count: h.count - 1 } : h));
  };

  const heirCount = (type: HeirType) => heirs.find(h => h.type === type)?.count ?? 0;

  // Validate step 1
  const validateStep1 = () => {
    if (!deceasedName.trim()) { setValidationError(isRtl ? 'يرجى إدخال اسم المتوفى' : 'Please enter the decedent name'); return false; }
    if (!totalEstate || Number(totalEstate) <= 0) { setValidationError(isRtl ? 'يرجى إدخال قيمة التركة' : 'Please enter estate value > 0'); return false; }
    setValidationError(''); return true;
  };

  const validateStep2 = () => {
    if (heirs.length === 0) { setValidationError(isRtl ? 'يرجى إضافة وارث واحد على الأقل' : 'Add at least one heir'); return false; }
    const errs = validateHeirs(heirs, deceasedGender);
    const fatal = errs.filter(e => e.severity === 'error');
    if (fatal.length > 0) { setValidationError(isRtl ? fatal[0].messageAr : fatal[0].message); return false; }
    setValidationError(''); return true;
  };

  const runCalculation = useCallback(() => {
    const r = calculateInheritance(deceased, heirs, madhab);
    setResult(r);
    setStep(5);
    toast({ title: isRtl ? 'تم الحساب بنجاح ✓' : 'Calculation complete ✓', description: isRtl ? `الصافي: ${formatNumber(r.distributableEstate)}` : `Net distributable: ${formatNumber(r.distributableEstate)}` });
    if (user) {
      saveCase.mutate({
        deceased,
        heirs,
        madhab,
        title: `${deceased.name} — ${new Date().toLocaleDateString()}`,
        result: r,
        assets,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deceased, heirs, madhab, assets, user]);

  const reset = () => {
    setStep(1); setResult(null); setHeirs([]); setAssets([]);
    setDeceasedName(''); setTotalEstate(''); setDebts('0'); setFuneralExp('0');
    setBequests('0'); setValidationError('');
    setDeductionOpen(true); setBlockedOpen(false);
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 4) { runCalculation(); return; }
    setValidationError('');
    setStep(s => s + 1);
  };

  const goBack = () => { setValidationError(''); setStep(s => s - 1); };

  // Enter key submits current step
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && step < 5 && !(e.target instanceof HTMLTextAreaElement)) {
        goNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, goNext]);

  // Group heirs by category
  const categories = [...new Set(AVAILABLE_HEIRS.map(h => h.category))];

  const inputCls = `w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all`;
  const labelCls = `block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5`;

  // Step 5 data
  const activeShares = result?.shares.filter(s => !s.blocked && s.amount > 0) ?? [];
  const blockedShares = result?.shares.filter(s => s.blocked) ?? [];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-heading text-foreground mb-2">{t('calculator')}</h1>
            <p className="text-muted-foreground text-sm">{t('calculator.breadcrumb')}</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((_, idx) => {
              const n = idx + 1;
              const active = n === step;
              const done = n < step;
              return (
                <div key={n} className="flex items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    done ? 'border-accent bg-accent text-navy' : active ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-background text-muted-foreground'
                  }`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : n}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-10 h-0.5 ${n < step ? 'bg-accent' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step label */}
          <p className="text-center text-accent font-semibold text-sm mb-6">{t(STEPS[step-1])}</p>

          {/* Error */}
          {validationError && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{validationError}
            </div>
          )}

          {/* ── STEP 1: Deceased + Estate ── */}
          {step === 1 && (
            <div className="luxury-card p-6 space-y-5">
              <h2 className="text-xl font-heading">{isRtl ? 'معلومات المتوفى والتركة' : 'Deceased & Estate Info'}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('estate.decedent')} *</label>
                  <input className={inputCls} value={deceasedName} onChange={e => setDeceasedName(e.target.value)} placeholder={isRtl ? 'اسم المتوفى' : 'Name of deceased'} />
                </div>
                <div>
                  <label className={labelCls}>{t('gender')}</label>
                  <div className="flex gap-2 mt-1">
                    {(['male','female'] as const).map(g => (
                      <button key={g} type="button" onClick={() => setDeceasedGender(g)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${deceasedGender === g ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-accent/40'}`}>
                        {g === 'male' ? (isRtl ? 'ذكر' : 'Male') : (isRtl ? 'أنثى' : 'Female')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{isRtl ? 'إجمالي التركة' : 'Total Estate'} *</label>
                  <input type="number" className={inputCls} value={totalEstate} onChange={e => setTotalEstate(e.target.value)} placeholder="0.00" min="0" />
                </div>
                <div>
                  <label className={labelCls}>{isRtl ? 'الديون' : 'Debts'}</label>
                  <input type="number" className={inputCls} value={debts} onChange={e => setDebts(e.target.value)} placeholder="0.00" min="0" />
                </div>
                <div>
                  <label className={labelCls}>{isRtl ? 'مصاريف الجنازة' : 'Funeral Expenses'}</label>
                  <input type="number" className={inputCls} value={funeralExp} onChange={e => setFuneralExp(e.target.value)} placeholder="0.00" min="0" />
                </div>
                <div>
                  <label className={labelCls}>{isRtl ? 'الوصايا (≤ ثلث الصافي)' : 'Bequests (≤ 1/3 of net)'}</label>
                  <input type="number" className={inputCls} value={bequests} onChange={e => setBequests(e.target.value)} placeholder="0.00" min="0" />
                </div>
              </div>
              {Number(totalEstate) > 0 && (
                <div className="rounded-xl p-4 bg-accent/5 border border-accent/20 text-sm text-muted-foreground">
                  <strong className="text-foreground">{isRtl ? 'الصافي المقدر: ' : 'Estimated net: '}</strong>
                  {formatNumber(Math.max(0, Number(totalEstate) - Number(debts) - Number(funeralExp) - Math.min(Number(bequests), Math.max(0,(Number(totalEstate)-Number(debts)-Number(funeralExp))/3))))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Heirs ── */}
          {step === 2 && (
            <div className="luxury-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading">{t('heirs')}</h2>
                {heirs.length > 0 && <span className="text-sm text-accent font-semibold">{heirs.reduce((s,h)=>s+h.count,0)} {isRtl ? 'وارث' : 'heir(s)'}</span>}
              </div>
              {categories.map(cat => {
                const catHeirs = AVAILABLE_HEIRS.filter(h => h.category === cat);
                const catDef = catHeirs[0];
                return (
                  <div key={cat}>
                    <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">{isRtl ? catDef.categoryAr : cat}</h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {catHeirs.map(def => {
                        const cnt = heirCount(def.type);
                        const isBlocked = (() => {
                          if (!def.blockedBy) return false;
                          return def.blockedBy.some(b => heirs.some(h => h.type === b && h.count > 0));
                        })();
                        return (
                          <div key={def.type} className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${cnt > 0 ? 'border-accent/50 bg-accent/5' : isBlocked ? 'border-border/30 opacity-40' : 'border-border hover:border-accent/30'}`}>
                            <div>
                              <span className="text-sm font-medium text-foreground">{isRtl ? def.labelAr : def.label}</span>
                              {isBlocked && <span className="text-xs text-destructive ms-2">{isRtl ? '(محجوب)' : '(blocked)'}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {cnt > 0 && (
                                <button onClick={() => removeHeir(def.type)} className="w-7 h-7 rounded-lg border border-border hover:border-accent/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-sm">−</button>
                              )}
                              {cnt > 0 && <span className="w-5 text-center font-bold text-accent text-sm">{cnt}</span>}
                              <button
                                disabled={isBlocked}
                                onClick={() => addHeir(def.type)}
                                className="w-7 h-7 rounded-lg border border-border hover:border-accent flex items-center justify-center text-muted-foreground hover:text-accent transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {heirs.length > 0 && (
                <div className="rounded-xl p-4 bg-accent/5 border border-accent/20">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">{isRtl ? 'الورثة المختارون' : 'Selected Heirs'}</p>
                  <div className="flex flex-wrap gap-2">
                    {heirs.map(h => {
                      const def = AVAILABLE_HEIRS.find(d => d.type === h.type);
                      return (
                        <span key={h.type} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-accent/30 bg-accent/8 text-accent">
                          {isRtl ? def?.labelAr : def?.label}{h.count > 1 ? ` ×${h.count}` : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Assets ── */}
          {step === 3 && (
            <div className="luxury-card p-6 space-y-5">
              <h2 className="text-xl font-heading">{isRtl ? 'أصول التركة' : 'Estate Assets'}</h2>
              <p className="text-sm text-muted-foreground">{isRtl ? 'أضف أصول التركة الإضافية — ستُضاف قيمتها إلى مبلغ التركة تلقائياً' : 'Add estate assets — their values will be automatically added to the estate total.'}</p>

              {/* Live Estate Total Banner */}
              <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{isRtl ? 'التركة (الخطوة 1)' : 'Manual Estate (Step 1)'}</span>
                  <span className="font-semibold">{formatNumber(step1Total)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{isRtl ? 'الأصول المضافة' : 'Assets Added'}</span>
                  <span className="font-semibold text-accent">+ {formatNumber(assetTotal)}</span>
                </div>
                <div className="h-px bg-accent/30 my-1" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{isRtl ? 'الإجمالي للحساب' : 'TOTAL FOR CALCULATION'}</span>
                  <span className="font-heading text-xl text-accent">{formatNumber(effectiveTotalEstate)}</span>
                </div>
              </div>

              {/* Asset category grid */}
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">{isRtl ? 'نوع الأصل' : 'Asset Categories'}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {ASSET_TYPES.map(at => (
                    <button key={at.id} onClick={() => {
                      setAssets(prev => {
                        const existing = prev.find(a => a.typeId === at.id);
                        if (existing) return prev;
                        return [...prev, { id: Math.random().toString(36).slice(2), typeId: at.id, description: '', value: 0, currency: 'EGP', fields: {} }];
                      });
                    }}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-accent/40 hover:bg-accent/5 transition-all text-xs">
                      <span className="text-xl">{at.icon}</span>
                      <span className="text-center leading-tight text-muted-foreground">{isRtl ? at.labelAr : at.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Added assets */}
              {assets.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">{isRtl ? 'الأصول المضافة' : 'Added Assets'}</p>
                  {assets.map((asset) => {
                    const def = ASSET_TYPES.find(a => a.id === asset.typeId);
                    const pct = effectiveTotalEstate > 0 ? ((asset.value || 0) / effectiveTotalEstate * 100).toFixed(1) : '0';
                    return (
                      <div key={asset.id} className="border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{def?.icon}</span>
                            <span className="font-semibold text-sm">{isRtl ? def?.labelAr : def?.label}</span>
                            {asset.value > 0 && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{pct}%</span>
                            )}
                          </div>
                          <button onClick={() => setAssets(prev => prev.filter(a => a.id !== asset.id))}
                            className="text-destructive hover:text-destructive/80 text-xs border border-destructive/30 px-2 py-1 rounded-lg transition-colors">
                            {isRtl ? 'حذف' : 'Remove'}
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">{isRtl ? 'الوصف' : 'Description'}</label>
                            <input value={asset.description} onChange={e => setAssets(prev => prev.map(a => a.id === asset.id ? {...a, description: e.target.value} : a))}
                              placeholder={def?.fields.find(f=>f.key==='description')?.placeholder ?? ''}
                              className="w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">{isRtl ? 'القيمة' : 'Value'}</label>
                            <input type="number" min="0" value={asset.value || ''} onChange={e => setAssets(prev => prev.map(a => a.id === asset.id ? {...a, value: Number(e.target.value)} : a))}
                              placeholder="0.00"
                              className="w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40" />
                          </div>
                        </div>
                        {def?.valuationNote && (
                          <p className="text-xs text-muted-foreground italic">{isRtl ? def.valuationNoteAr : def.valuationNote}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Madhab ── */}
          {step === 4 && (
            <div className="luxury-card p-6 space-y-5">
              <h2 className="text-xl font-heading">{t('madhab')}</h2>

              {/* Confirmed estate total */}
              <div className="rounded-xl p-3 bg-accent/5 border border-accent/20 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{isRtl ? 'التركة للحساب' : 'Estate for calculation'}</span>
                <span className="font-heading text-accent text-lg">{formatNumber(effectiveTotalEstate)}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {([
                  ['jumhur', isRtl ? 'رأي الجمهور' : 'Jumhur (Majority)', isRtl ? 'رأي جمهور الفقهاء — بلا رد للزوجين' : 'Majority scholarly view — no Radd to spouses'],
                  ['hanafi', isRtl ? 'الحنفي' : 'Hanafi', isRtl ? 'الرد لا يشمل الزوجين' : 'No Radd to spouses'],
                  ['maliki', isRtl ? 'المالكي' : 'Maliki', isRtl ? 'الرد يشمل الزوج دون الزوجة' : 'Radd to husband, not wife'],
                  ['shafii', isRtl ? 'الشافعي' : 'Shafi\'i', isRtl ? 'الرد لا يشمل الزوجين' : 'No Radd to spouses'],
                  ['hanbali', isRtl ? 'الحنبلي' : 'Hanbali', isRtl ? 'الرد لا يشمل الزوجين' : 'No Radd to spouses'],
                ] as [Madhab, string, string][]).map(([m, label, note]) => (
                  <button key={m} type="button" onClick={() => setMadhab(m)}
                    className={`p-5 rounded-2xl border-2 text-start transition-all ${madhab === m ? 'border-accent bg-accent/8' : 'border-border hover:border-accent/40'}`}>
                    <p className={`font-bold text-base mb-1 ${madhab === m ? 'text-accent' : 'text-foreground'}`}>{label}</p>
                    <p className="text-xs text-muted-foreground">{note}</p>
                  </button>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm text-muted-foreground">
                {isRtl
                  ? 'تنبيه: تختلف المذاهب في بعض مسائل الرد والحجب. يُنصح باستشارة عالم مؤهل.'
                  : 'Note: Madhabs differ on Radd and some Hajb cases. Consult a qualified scholar for binding decisions.'}
              </div>
            </div>
          )}

          {/* ── STEP 5: Results ── */}
          {step === 5 && result && (
            <div className="space-y-5">
              {/* Top summary cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="luxury-card p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{isRtl ? 'إجمالي التركة' : 'Gross Estate'}</p>
                  <p className="text-2xl font-heading">{formatNumber(effectiveTotalEstate)}</p>
                  {assetTotal > 0 && <p className="text-xs text-muted-foreground mt-1">{isRtl ? `قيمة أصول: ${formatNumber(assetTotal)}` : `incl. assets: ${formatNumber(assetTotal)}`}</p>}
                </div>
                <div className="luxury-card p-5 border-accent/30">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{t('net')}</p>
                  <p className="text-2xl font-heading text-accent">{formatNumber(result.distributableEstate)}</p>
                </div>
                <div className="luxury-card p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{t('madhab')}</p>
                  <p className="text-2xl font-heading capitalize">{madhab}</p>
                </div>
              </div>

              {/* Asset Breakdown */}
              {assets.length > 0 && (
                <div className="luxury-card p-5">
                  <h3 className="font-heading text-base mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-accent" />
                    {isRtl ? 'تفصيل الأصول' : 'Asset Breakdown'}
                  </h3>
                  <div className="space-y-2">
                    {assets.map((asset) => {
                      const def = ASSET_TYPES.find(a => a.id === asset.typeId);
                      const pct = effectiveTotalEstate > 0 ? (asset.value / effectiveTotalEstate * 100).toFixed(1) : '0';
                      return (
                        <div key={asset.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span>{def?.icon ?? '📦'}</span>
                            <div>
                              <span className="text-sm font-medium">{isRtl ? def?.labelAr : def?.label}</span>
                              {asset.description && <span className="text-xs text-muted-foreground ms-2">({asset.description})</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
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
                  </div>
                </div>
              )}

              {/* Deduction Summary (collapsible) */}
              <div className="luxury-card overflow-hidden">
                <button
                  onClick={() => setDeductionOpen(o => !o)}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                  <h3 className="font-heading text-base">{isRtl ? 'ملخص الاستقطاعات' : 'Deduction Summary'}</h3>
                  {deductionOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {deductionOpen && (
                  <div className="px-5 pb-5 space-y-2 text-sm border-t border-border">
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">{isRtl ? 'إجمالي التركة' : 'Gross Estate'}</span>
                      <span className="font-semibold">{formatNumber(effectiveTotalEstate)}</span>
                    </div>
                    {Number(funeralExp) > 0 && (
                      <div className="flex justify-between py-1 text-muted-foreground">
                        <span>− {isRtl ? 'مصاريف الجنازة' : 'Funeral Expenses'}</span>
                        <span>({formatNumber(Number(funeralExp))})</span>
                      </div>
                    )}
                    {Number(debts) > 0 && (
                      <div className="flex justify-between py-1 text-muted-foreground">
                        <span>− {isRtl ? 'الديون' : 'Debts'}</span>
                        <span>({formatNumber(Number(debts))})</span>
                      </div>
                    )}
                    {Number(bequests) > 0 && (
                      <div className="flex justify-between py-1 text-muted-foreground">
                        <span>− {isRtl ? 'الوصايا (محدودة بالثلث)' : 'Bequests (capped at 1/3)'}</span>
                        <span>({formatNumber(Math.min(Number(bequests), Math.max(0, (effectiveTotalEstate - Number(debts) - Number(funeralExp)) / 3)))})</span>
                      </div>
                    )}
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between font-bold text-accent">
                      <span>{isRtl ? '= الصافي القابل للتوزيع' : '= Net Distributable'}</span>
                      <span>{formatNumber(result.distributableEstate)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Flags */}
              {(result.awlApplied || result.raddApplied || result.specialCase) && (
                <div className="luxury-card p-4 space-y-2">
                  {result.awlApplied && <div className="flex items-center gap-2 text-sm text-amber-600"><AlertCircle className="w-4 h-4" /> {isRtl ? 'تم تطبيق العول — الأنصبة تجاوزت 100%' : 'Awl applied — shares exceeded 100%, proportionally reduced'}</div>}
                  {result.raddApplied && <div className="flex items-center gap-2 text-sm text-blue-600"><CheckCircle2 className="w-4 h-4" /> {isRtl ? 'تم تطبيق الرد — الفائض أُعيد للورثة' : 'Radd applied — surplus returned to eligible heirs'}</div>}
                  {result.specialCase && <div className="text-sm text-muted-foreground italic">{isRtl ? result.specialCaseAr : result.specialCase}</div>}
                </div>
              )}

              {/* Pie chart */}
              {activeShares.length > 0 && (
                <div className="luxury-card p-5">
                  <h3 className="font-heading text-lg mb-4">{isRtl ? 'توزيع التركة' : 'Share Distribution'}</h3>
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
                            <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatNumber(Number(v))} labelFormatter={(_, payload) => payload?.[0]?.payload?.heir?.name ?? ''} />
                        <Legend formatter={(v: string) => v} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Results table — active heirs */}
              <div className="luxury-card overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-heading text-lg">{isRtl ? 'أنصبة الورثة' : 'Heir Shares'}</h3>
                </div>
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
              </div>

              {/* Blocked heirs (collapsible) */}
              {blockedShares.length > 0 && (
                <div className="luxury-card overflow-hidden">
                  <button
                    onClick={() => setBlockedOpen(o => !o)}
                    className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                    <h3 className="font-heading text-base text-muted-foreground">
                      {isRtl ? `الورثة المحجوبون (${blockedShares.length})` : `Blocked Heirs (${blockedShares.length})`}
                    </h3>
                    {blockedOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
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
                </div>
              )}

              {/* Calculation steps */}
              <div className="luxury-card p-5">
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
              </div>

              {/* Notes */}
              {result.notes.length > 0 && (
                <div className="luxury-card p-5">
                  <h3 className="font-heading text-base mb-3">{isRtl ? 'ملاحظات' : 'Notes'}</h3>
                  <ul className="space-y-2">
                    {result.notes.map((n, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="text-accent mt-0.5">•</span>{isRtl ? result.notesAr[i] : n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save indicator */}
              {user && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Save className="w-4 h-4" />{isRtl ? 'تم حفظ القضية تلقائيًا في لوحة التحكم' : 'Case auto-saved to your dashboard'}
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground text-center">
                {isRtl
                  ? 'تنبيه: هذه الحسابات للأغراض التعليمية. يُرجى مراجعة عالم أو محامٍ مؤهل قبل أي قرار ملزم.'
                  : 'Disclaimer: These calculations are for educational purposes. Consult a qualified Islamic scholar or attorney before any binding decision.'}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 5 && (
            <div className={`flex mt-6 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
              {step > 1 && (
                <button onClick={goBack} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-muted-foreground hover:border-accent/40 hover:text-foreground transition-all">
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  {isRtl ? 'السابق' : 'Back'}
                </button>
              )}
              <button onClick={goNext}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-navy text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
                style={{ background: 'linear-gradient(135deg,#f1d377,#c9a84c 50%,#9f7c26)' }}>
                {step === 4 ? (isRtl ? 'احسب الميراث' : 'Calculate') : (isRtl ? 'التالي' : 'Continue')}
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="flex gap-3 mt-6 flex-wrap">
              <button onClick={reset} className="px-6 py-3 rounded-xl border border-border text-muted-foreground hover:border-accent/40 hover:text-foreground transition-all text-sm">
                {isRtl ? '← حساب جديد' : '← New Calculation'}
              </button>
              <button onClick={() => window.print()} className="px-6 py-3 rounded-xl border border-border text-muted-foreground hover:border-accent/40 hover:text-foreground transition-all text-sm">
                {isRtl ? 'طباعة / PDF' : 'Print / PDF'}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CalculatorPage;
