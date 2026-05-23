// ============================================================
// MIRATH — Complete Islamic Inheritance Engine (Farayid)
// Quran: An-Nisa 4:11, 4:12, 4:176 | All 4 Madhabs + Jumhur
// ============================================================

export type Madhab = 'jumhur' | 'hanafi' | 'shafii' | 'maliki' | 'hanbali';

export interface DeceasedInfo {
  name: string;
  gender: 'male' | 'female';
  totalEstate: number;
  debts: number;
  funeralExpenses: number;
  bequests: number;
}

export interface Heir {
  id: string;
  type: HeirType;
  name: string;
  count: number;
}

export type HeirType =
  | 'husband' | 'wife'
  | 'son' | 'daughter'
  | 'father' | 'mother'
  | 'paternalGrandfather' | 'paternalGrandmother' | 'maternalGrandmother'
  | 'sonsSon' | 'sonsDaughter'
  | 'fullBrother' | 'fullSister'
  | 'paternalBrother' | 'paternalSister'
  | 'maternalBrother' | 'maternalSister'
  | 'fullBrothersonsSon' | 'paternalBrothersonsSon'
  | 'paternalUncle' | 'paternalUncleSon';

export interface HeirDefinition {
  type: HeirType;
  label: string;
  labelAr: string;
  category: string;
  categoryAr: string;
  gender: 'male' | 'female';
  maxCount?: number;
  blockedBy?: HeirType[];
}

export interface HeirShare {
  heir: { type: HeirType; name: string; count: number };
  amount: number;
  fraction: string;
  percentage: number;
  shareType: 'fard' | 'asaba' | 'fard_then_asaba' | 'blocked' | 'baitulmal';
  explanation: string;
  explanationAr: string;
  blocked?: boolean;
  blockReason?: string;
  blockReasonAr?: string;
  quranicRef?: string;
  quranicText?: string;
  /** Amount per individual when count > 1 */
  perPersonAmount?: number;
  /** Fraction per individual when count > 1 */
  perPersonFraction?: string;
}

export interface CalculationStep {
  stepNumber: number;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  formula?: string;
}

export interface CalculationResult {
  shares: HeirShare[];
  distributableEstate: number;
  totalAllocated: number;
  awlApplied: boolean;
  raddApplied: boolean;
  awlFactor?: number;
  raddFactor?: number;
  notes: string[];
  notesAr: string[];
  steps: CalculationStep[];
  specialCase?: string;
  specialCaseAr?: string;
  baitulmal?: number;
}

export interface ValidationError {
  severity: 'error' | 'warning';
  message: string;
  messageAr: string;
}

// ============ HEIR DEFINITIONS ============
export const AVAILABLE_HEIRS: HeirDefinition[] = [
  // Spouses
  { type: 'husband', label: 'Husband', labelAr: 'الزوج', category: 'Spouses', categoryAr: 'الزوجان', gender: 'male', maxCount: 1 },
  { type: 'wife', label: 'Wife', labelAr: 'الزوجة', category: 'Spouses', categoryAr: 'الزوجان', gender: 'female', maxCount: 4 },
  // Children
  { type: 'son', label: 'Son', labelAr: 'الابن', category: 'Children', categoryAr: 'الأبناء', gender: 'male' },
  { type: 'daughter', label: 'Daughter', labelAr: 'البنت', category: 'Children', categoryAr: 'الأبناء', gender: 'female' },
  // Grandchildren (from son)
  { type: 'sonsSon', label: "Son's Son (Grandson)", labelAr: 'ابن الابن', category: 'Grandchildren', categoryAr: 'أبناء الأبناء', gender: 'male', blockedBy: ['son'] },
  { type: 'sonsDaughter', label: "Son's Daughter (Granddaughter)", labelAr: 'بنت الابن', category: 'Grandchildren', categoryAr: 'أبناء الأبناء', gender: 'female', blockedBy: ['son', 'daughter'] },
  // Parents
  { type: 'father', label: 'Father', labelAr: 'الأب', category: 'Parents', categoryAr: 'الوالدان', gender: 'male' },
  { type: 'mother', label: 'Mother', labelAr: 'الأم', category: 'Parents', categoryAr: 'الوالدان', gender: 'female' },
  // Grandparents
  { type: 'paternalGrandfather', label: 'Paternal Grandfather', labelAr: 'الجد لأب', category: 'Grandparents', categoryAr: 'الأجداد', gender: 'male', blockedBy: ['father'] },
  { type: 'paternalGrandmother', label: 'Paternal Grandmother', labelAr: 'الجدة لأب', category: 'Grandparents', categoryAr: 'الأجداد', gender: 'female', blockedBy: ['mother', 'father'] },
  { type: 'maternalGrandmother', label: 'Maternal Grandmother', labelAr: 'الجدة لأم', category: 'Grandparents', categoryAr: 'الأجداد', gender: 'female', blockedBy: ['mother'] },
  // Full siblings
  { type: 'fullBrother', label: 'Full Brother', labelAr: 'الأخ الشقيق', category: 'Full Siblings', categoryAr: 'الإخوة الأشقاء', gender: 'male', blockedBy: ['son', 'sonsSon', 'father'] },
  { type: 'fullSister', label: 'Full Sister', labelAr: 'الأخت الشقيقة', category: 'Full Siblings', categoryAr: 'الإخوة الأشقاء', gender: 'female', blockedBy: ['son', 'sonsSon', 'father'] },
  // Paternal siblings
  { type: 'paternalBrother', label: 'Paternal Half-Brother', labelAr: 'الأخ لأب', category: 'Paternal Siblings', categoryAr: 'الإخوة لأب', gender: 'male', blockedBy: ['son', 'sonsSon', 'father', 'fullBrother'] },
  { type: 'paternalSister', label: 'Paternal Half-Sister', labelAr: 'الأخت لأب', category: 'Paternal Siblings', categoryAr: 'الإخوة لأب', gender: 'female', blockedBy: ['son', 'sonsSon', 'father', 'fullBrother'] },
  // Maternal siblings
  { type: 'maternalBrother', label: 'Maternal Half-Brother', labelAr: 'الأخ لأم', category: 'Maternal Siblings', categoryAr: 'الإخوة لأم', gender: 'male', blockedBy: ['son', 'daughter', 'sonsSon', 'sonsDaughter', 'father', 'paternalGrandfather'] },
  { type: 'maternalSister', label: 'Maternal Half-Sister', labelAr: 'الأخت لأم', category: 'Maternal Siblings', categoryAr: 'الإخوة لأم', gender: 'female', blockedBy: ['son', 'daughter', 'sonsSon', 'sonsDaughter', 'father', 'paternalGrandfather'] },
  // Nephews (sons of brothers)
  { type: 'fullBrothersonsSon', label: "Full Brother's Son", labelAr: 'ابن الأخ الشقيق', category: 'Nephews', categoryAr: 'أبناء الإخوة', gender: 'male', blockedBy: ['son', 'sonsSon', 'father', 'paternalGrandfather', 'fullBrother', 'paternalBrother'] },
  { type: 'paternalBrothersonsSon', label: "Paternal Brother's Son", labelAr: 'ابن الأخ لأب', category: 'Nephews', categoryAr: 'أبناء الإخوة', gender: 'male', blockedBy: ['son', 'sonsSon', 'father', 'paternalGrandfather', 'fullBrother', 'paternalBrother', 'fullBrothersonsSon'] },
  // Uncles & cousins
  { type: 'paternalUncle', label: 'Paternal Uncle', labelAr: 'العم', category: 'Uncles', categoryAr: 'الأعمام', gender: 'male', blockedBy: ['son', 'sonsSon', 'father', 'paternalGrandfather', 'fullBrother', 'paternalBrother', 'fullBrothersonsSon', 'paternalBrothersonsSon'] },
  { type: 'paternalUncleSon', label: "Paternal Uncle's Son (Cousin)", labelAr: 'ابن العم', category: 'Uncles', categoryAr: 'الأعمام', gender: 'male', blockedBy: ['son', 'sonsSon', 'father', 'paternalGrandfather', 'fullBrother', 'paternalBrother', 'fullBrothersonsSon', 'paternalBrothersonsSon', 'paternalUncle'] },
];

export function getHeirLabel(type: HeirType): string {
  return AVAILABLE_HEIRS.find(h => h.type === type)?.label || type;
}
export function getHeirLabelAr(type: HeirType): string {
  return AVAILABLE_HEIRS.find(h => h.type === type)?.labelAr || type;
}

// ============ BLOCKING (HAJB) ============
function isBlocked(type: HeirType, presentHeirs: HeirType[]): boolean {
  const def = AVAILABLE_HEIRS.find(d => d.type === type);
  if (!def?.blockedBy) return false;
  return def.blockedBy.some(b => presentHeirs.includes(b));
}

function getBlockedBy(type: HeirType, presentHeirs: HeirType[]): HeirType | null {
  const def = AVAILABLE_HEIRS.find(d => d.type === type);
  if (!def?.blockedBy) return null;
  return def.blockedBy.find(b => presentHeirs.includes(b)) ?? null;
}

// ============ HELPER: has descendants ============
function hasDesc(heirs: HeirType[]): boolean {
  return ['son','daughter','sonsSon','sonsDaughter'].some(t => heirs.includes(t as HeirType));
}
function hasMaleDesc(heirs: HeirType[]): boolean {
  return ['son','sonsSon'].some(t => heirs.includes(t as HeirType));
}

// ============ GCD for fractions ============
function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
function lcm(a: number, b: number): number { return (a / gcd(a, b)) * b; }
function simplify(n: number, d: number): [number, number] {
  if (n === 0) return [0, 1];
  const g = gcd(Math.abs(n), Math.abs(d));
  return [n / g, d / g];
}
function fracStr(n: number, d: number): string {
  const [sn, sd] = simplify(n, d);
  if (sn === 0) return '0';
  if (sn === sd) return '1';
  return `${sn}/${sd}`;
}

/**
 * Convert a decimal ratio (0–1) to nearest simple fraction with denominator ≤ 24.
 * Falls back to decimal percentage if denominator would exceed 24.
 */
function ratioToFraction(ratio: number): string {
  if (ratio <= 0) return '0';
  if (ratio >= 1) return '1';
  // Try denominators 1..24
  let bestNum = 0, bestDen = 1, bestErr = Infinity;
  for (let d = 1; d <= 24; d++) {
    const n = Math.round(ratio * d);
    if (n <= 0 || n > d) continue;
    const err = Math.abs(ratio - n / d);
    if (err < bestErr) { bestErr = err; bestNum = n; bestDen = d; }
  }
  // Accept if error is tiny (<0.5%)
  if (bestErr < 0.005) {
    const [sn, sd] = simplify(bestNum, bestDen);
    return `${sn}/${sd}`;
  }
  // Fall back to percentage
  return `${(ratio * 100).toFixed(2)}%`;
}

// ============ MAIN CALCULATION ============
export function calculateInheritance(
  deceased: DeceasedInfo,
  inputHeirs: Heir[],
  madhab: Madhab
): CalculationResult {
  const steps: CalculationStep[] = [];
  const notes: string[] = [];
  const notesAr: string[] = [];

  // ── 1. Net estate ──────────────────────────────────────────
  const gross = deceased.totalEstate;
  const totalDed = (deceased.debts || 0) + (deceased.funeralExpenses || 0);
  const afterDed = Math.max(0, gross - totalDed);
  const maxBequest = afterDed / 3;
  const bequest = Math.min(deceased.bequests || 0, maxBequest);
  const net = Math.max(0, afterDed - bequest);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Net Distributable Estate',
    titleAr: 'حساب صافي التركة القابلة للتوزيع',
    description: `Gross ${gross} − Debts ${deceased.debts} − Funeral ${deceased.funeralExpenses} − Bequests ${bequest.toFixed(2)} = ${net.toFixed(2)}`,
    descriptionAr: `إجمالي ${gross} − ديون ${deceased.debts} − جنازة ${deceased.funeralExpenses} − وصايا ${bequest.toFixed(2)} = ${net.toFixed(2)}`,
    formula: `Net = ${net.toFixed(2)}`,
  });

  if (deceased.bequests > maxBequest && maxBequest > 0) {
    notes.push(`Bequests capped at 1/3 of net estate (max ${maxBequest.toFixed(2)}).`);
    notesAr.push(`الوصية محدودة بثلث التركة الصافية (الحد الأقصى ${maxBequest.toFixed(2)}).`);
  }

  // ── 2. Build active heir types ─────────────────────────────
  // First pass: remove heirs blocked by other heirs in list
  const allTypes = inputHeirs.map(h => h.type);
  const activeHeirs = inputHeirs.filter(h => !isBlocked(h.type, allTypes));
  const activeTypes = activeHeirs.map(h => h.type);

  const blockedHeirs = inputHeirs.filter(h => isBlocked(h.type, allTypes));

  steps.push({
    stepNumber: 2,
    title: 'Apply Hajb (Exclusion Rules)',
    titleAr: 'تطبيق الحجب',
    description: `${inputHeirs.length} heirs → ${activeHeirs.length} eligible after Hajb. Blocked: ${blockedHeirs.map(h => getHeirLabel(h.type)).join(', ') || 'none'}`,
    descriptionAr: `${inputHeirs.length} وارث → ${activeHeirs.length} مستحق بعد الحجب. المحجوبون: ${blockedHeirs.map(h => getHeirLabelAr(h.type)).join('، ') || 'لا أحد'}`,
  });

  // ── 3. Assign shares ───────────────────────────────────────
  // We track shares as { numerator, denominator } over a common LCD

  type ShareEntry = { n: number; d: number; type: 'fard' | 'asaba' | 'fard_then_asaba'; heir: Heir };
  const shareMap = new Map<HeirType, ShareEntry>();

  const has = (t: HeirType) => activeTypes.includes(t);
  const count = (t: HeirType) => activeHeirs.find(h => h.type === t)?.count ?? 0;

  // ── SPOUSES ──
  if (has('husband')) {
    // husband: 1/2 no descendants, 1/4 with descendants
    const share = hasDesc(activeTypes) ? [1, 4] : [1, 2];
    shareMap.set('husband', { n: share[0], d: share[1], type: 'fard', heir: activeHeirs.find(h => h.type === 'husband')! });
  }
  if (has('wife')) {
    // wives share: 1/4 no descendants, 1/8 with descendants (split among all wives)
    const share = hasDesc(activeTypes) ? [1, 8] : [1, 4];
    shareMap.set('wife', { n: share[0], d: share[1], type: 'fard', heir: activeHeirs.find(h => h.type === 'wife')! });
  }

  // ── MOTHER ──
  if (has('mother')) {
    // 1/6 if descendants OR ≥2 siblings; 1/3 of remainder in Umariyyatain; else 1/3
    const sibCount = ['fullBrother','fullSister','paternalBrother','paternalSister','maternalBrother','maternalSister']
      .reduce((s, t) => s + count(t as HeirType), 0);
    const hasSpouse = has('husband') || has('wife');
    const hasFather = has('father');

    if (hasDesc(activeTypes) || sibCount >= 2) {
      shareMap.set('mother', { n: 1, d: 6, type: 'fard', heir: activeHeirs.find(h => h.type === 'mother')! });
    } else if (hasFather && hasSpouse) {
      // Umariyyatain: mother gets 1/3 of what remains after spouse
      // We mark it and handle it post-hoc
      shareMap.set('mother', { n: 1, d: 3, type: 'fard', heir: activeHeirs.find(h => h.type === 'mother')! });
      notes.push('Umariyyatain: Mother receives 1/3 of remainder after spouse share.');
      notesAr.push('عمريتين: الأم ترث ثلث الباقي بعد نصيب الزوج/الزوجة.');
    } else {
      shareMap.set('mother', { n: 1, d: 3, type: 'fard', heir: activeHeirs.find(h => h.type === 'mother')! });
    }
  }

  // ── PATERNAL GRANDMOTHER ──
  if (has('paternalGrandmother')) {
    shareMap.set('paternalGrandmother', { n: 1, d: 6, type: 'fard', heir: activeHeirs.find(h => h.type === 'paternalGrandmother')! });
  }
  // ── MATERNAL GRANDMOTHER ──
  if (has('maternalGrandmother')) {
    shareMap.set('maternalGrandmother', { n: 1, d: 6, type: 'fard', heir: activeHeirs.find(h => h.type === 'maternalGrandmother')! });
  }

  // ── FATHER ──
  if (has('father')) {
    if (hasDesc(activeTypes)) {
      // Gets 1/6 fixed + residue as Asaba if anything left
      shareMap.set('father', { n: 1, d: 6, type: 'fard_then_asaba', heir: activeHeirs.find(h => h.type === 'father')! });
    } else {
      // No descendants → father takes all residue as Asaba (no fixed share)
      shareMap.set('father', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'father')! });
    }
  }

  // ── PATERNAL GRANDFATHER (when no father) ──
  if (has('paternalGrandfather') && !has('father')) {
    if (hasDesc(activeTypes)) {
      shareMap.set('paternalGrandfather', { n: 1, d: 6, type: 'fard_then_asaba', heir: activeHeirs.find(h => h.type === 'paternalGrandfather')! });
    } else {
      shareMap.set('paternalGrandfather', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'paternalGrandfather')! });
    }
  }

  // ── DAUGHTERS ──
  if (has('daughter') && !has('son')) {
    const dc = count('daughter');
    if (dc === 1) shareMap.set('daughter', { n: 1, d: 2, type: 'fard', heir: activeHeirs.find(h => h.type === 'daughter')! });
    else shareMap.set('daughter', { n: 2, d: 3, type: 'fard', heir: activeHeirs.find(h => h.type === 'daughter')! });
  }

  // ── SON (always Asaba — takes residue, daughters get half of son's share) ──
  if (has('son')) {
    shareMap.set('son', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'son')! });
    if (has('daughter')) {
      // daughter with son → Asaba too (gets half of what son gets per head)
      shareMap.set('daughter', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'daughter')! });
    }
  }

  // ── SONS'S SON (grandson from son) ──
  if (has('sonsSon') && !has('son')) {
    shareMap.set('sonsSon', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'sonsSon')! });
    if (has('sonsDaughter')) {
      shareMap.set('sonsDaughter', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'sonsDaughter')! });
    }
  } else if (has('sonsDaughter') && !has('son') && !has('sonsSon')) {
    const sdc = count('sonsDaughter');
    // sonsDaughter without sonsSon:
    // If there's a daughter with 1/2, sonsDaughter gets 1/6 to complete 2/3
    // Otherwise same rules as daughter
    if (has('daughter') && count('daughter') === 1) {
      shareMap.set('sonsDaughter', { n: 1, d: 6, type: 'fard', heir: activeHeirs.find(h => h.type === 'sonsDaughter')! });
    } else if (!has('daughter')) {
      if (sdc === 1) shareMap.set('sonsDaughter', { n: 1, d: 2, type: 'fard', heir: activeHeirs.find(h => h.type === 'sonsDaughter')! });
      else shareMap.set('sonsDaughter', { n: 2, d: 3, type: 'fard', heir: activeHeirs.find(h => h.type === 'sonsDaughter')! });
    }
    // else blocked by 2+ daughters (mahjuba)
  }

  // ── MATERNAL SIBLINGS (Ikhwa li umm) ──
  if (has('maternalBrother') || has('maternalSister')) {
    const mbc = count('maternalBrother');
    const msc = count('maternalSister');
    const total = mbc + msc;
    if (total === 1) {
      const type = has('maternalBrother') ? 'maternalBrother' : 'maternalSister';
      shareMap.set(type, { n: 1, d: 6, type: 'fard', heir: activeHeirs.find(h => h.type === type)! });
    } else {
      // Share 1/3 equally (no gender difference for maternal siblings)
      if (has('maternalBrother')) shareMap.set('maternalBrother', { n: 1, d: 3, type: 'fard', heir: activeHeirs.find(h => h.type === 'maternalBrother')! });
      if (has('maternalSister')) shareMap.set('maternalSister', { n: 1, d: 3, type: 'fard', heir: activeHeirs.find(h => h.type === 'maternalSister')! });
    }
  }

  // ── FULL SIBLINGS (Asaba) ──
  if (has('fullBrother')) {
    shareMap.set('fullBrother', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'fullBrother')! });
    if (has('fullSister')) shareMap.set('fullSister', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'fullSister')! });
  } else if (has('fullSister') && !has('fullBrother')) {
    // fullSister without brother
    const fsc = count('fullSister');
    const hasDaughtersOrSonsDaughters = has('daughter') || has('sonsDaughter');
    if (hasDaughtersOrSonsDaughters) {
      // Full sister becomes Asaba ma'a ghayriha (with daughters)
      shareMap.set('fullSister', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'fullSister')! });
      notes.push('Full sister(s) inherit as Asaba with daughters (Asaba ma\'a al-Ghair).');
      notesAr.push('الأخت الشقيقة ترث تعصيبًا مع البنات (عصبة مع الغير).');
    } else {
      if (fsc === 1) shareMap.set('fullSister', { n: 1, d: 2, type: 'fard', heir: activeHeirs.find(h => h.type === 'fullSister')! });
      else shareMap.set('fullSister', { n: 2, d: 3, type: 'fard', heir: activeHeirs.find(h => h.type === 'fullSister')! });
    }
  }

  // ── PATERNAL SIBLINGS ──
  if (!has('fullBrother') && !has('fullSister')) {
    if (has('paternalBrother')) {
      shareMap.set('paternalBrother', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'paternalBrother')! });
      if (has('paternalSister')) shareMap.set('paternalSister', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'paternalSister')! });
    } else if (has('paternalSister')) {
      const psc = count('paternalSister');
      const hasDaughtersForAsaba = has('daughter') || has('sonsDaughter');
      if (hasDaughtersForAsaba) {
        shareMap.set('paternalSister', { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === 'paternalSister')! });
      } else {
        if (psc === 1) shareMap.set('paternalSister', { n: 1, d: 2, type: 'fard', heir: activeHeirs.find(h => h.type === 'paternalSister')! });
        else shareMap.set('paternalSister', { n: 2, d: 3, type: 'fard', heir: activeHeirs.find(h => h.type === 'paternalSister')! });
      }
    }
  }

  // ── NEPHEWS & UNCLES (all Asaba) ──
  for (const t of ['fullBrothersonsSon','paternalBrothersonsSon','paternalUncle','paternalUncleSon'] as HeirType[]) {
    if (has(t) && !shareMap.has(t)) {
      shareMap.set(t, { n: 0, d: 1, type: 'asaba', heir: activeHeirs.find(h => h.type === t)! });
    }
  }

  // ── 4. Compute LCD and sum fard fractions ─────────────────
  const fardEntries = [...shareMap.values()].filter(e => e.type === 'fard' || e.type === 'fard_then_asaba');

  // Calculate LCD
  let denomLCD = 1;
  for (const e of fardEntries) {
    if (e.n > 0) denomLCD = lcm(denomLCD, e.d);
  }

  // Sum fard numerators over LCD
  let totalFardNum = 0;
  for (const e of fardEntries) {
    if (e.n > 0) totalFardNum += e.n * (denomLCD / e.d);
  }

  steps.push({
    stepNumber: 3,
    title: 'Sum Fixed Shares (Fard)',
    titleAr: 'جمع الأنصبة المقدرة (الفروض)',
    description: `Fixed shares sum to ${totalFardNum}/${denomLCD} = ${(totalFardNum/denomLCD*100).toFixed(2)}%`,
    descriptionAr: `مجموع الفروض = ${totalFardNum}/${denomLCD} = ${(totalFardNum/denomLCD*100).toFixed(2)}%`,
  });

  // ── 5. Awl (if fard > 1) ──────────────────────────────────
  let awlApplied = false;
  let awlFactor = 1;
  if (totalFardNum > denomLCD) {
    awlFactor = denomLCD / totalFardNum;
    awlApplied = true;
    notes.push(`Awl (عول) applied: shares totalled ${(totalFardNum/denomLCD*100).toFixed(2)}%, proportionally reduced.`);
    notesAr.push(`تم تطبيق العول: الفروض بلغت ${(totalFardNum/denomLCD*100).toFixed(2)}%، خُفِّضت بالنسبة.`);
    steps.push({
      stepNumber: 4,
      title: 'Awl — Proportional Reduction',
      titleAr: 'العول — تخفيض الأنصبة بالنسبة',
      description: `Shares > 100%. All reduced by factor ${awlFactor.toFixed(4)}. New base = ${totalFardNum}.`,
      descriptionAr: `الفروض تجاوزت 100%. خُفِّضت بعامل ${awlFactor.toFixed(4)}. الأصل الجديد = ${totalFardNum}.`,
      formula: `Awl factor = ${denomLCD}/${totalFardNum}`,
    });
    denomLCD = totalFardNum; // extend asl
    totalFardNum = totalFardNum; // now equals denomLCD
  }

  // ── 6. Compute fard amounts ───────────────────────────────
  const amounts = new Map<HeirType, number>();

  // Umariyyatain: recalculate mother's share as 1/3 of remainder after spouse
  const isUmariyyatain = notes.some(n => n.includes('Umariyyatain'));

  for (const [type, e] of shareMap) {
    if ((e.type === 'fard' || e.type === 'fard_then_asaba') && e.n > 0) {
      let amount: number;
      if (isUmariyyatain && type === 'mother') {
        const spouseAmount = amounts.get('husband') ?? amounts.get('wife') ?? 0;
        const afterSpouse = net - spouseAmount;
        amount = afterSpouse / 3;
      } else {
        amount = net * (e.n / e.d) * (awlApplied ? awlFactor : 1);
      }
      amounts.set(type, amount);
    }
  }

  // ── 7. Residue for Asaba ──────────────────────────────────
  let allocated = 0;
  for (const [, v] of amounts) allocated += v;
  let residue = Math.max(0, net - allocated);

  // Collect asaba heirs in priority order
  // Priority: son/daughter > sonsSon/sonsDaughter > father > paternalGrandfather
  //         > fullBrother/fullSister > paternalBrother/paternalSister
  //         > fullBrothersonsSon > paternalBrothersonsSon > paternalUncle > paternalUncleSon
  const asabaPriority: HeirType[] = [
    'son','daughter','sonsSon','sonsDaughter',
    'father','paternalGrandfather',
    'fullBrother','fullSister',
    'paternalBrother','paternalSister',
    'fullBrothersonsSon','paternalBrothersonsSon',
    'paternalUncle','paternalUncleSon',
  ];

  // Get highest-priority asaba group present
  let asabaGroup: HeirType[] = [];
  for (const t of asabaPriority) {
    if (shareMap.has(t) && shareMap.get(t)!.type === 'asaba') {
      // Collect same-priority group
      // son+daughter go together, fullBrother+fullSister go together, etc.
      const groupPairs: HeirType[][] = [
        ['son','daughter'],['sonsSon','sonsDaughter'],
        ['father'],['paternalGrandfather'],
        ['fullBrother','fullSister'],['paternalBrother','paternalSister'],
        ['fullBrothersonsSon'],['paternalBrothersonsSon'],['paternalUncle'],['paternalUncleSon'],
      ];
      const myGroup = groupPairs.find(g => g.includes(t));
      if (myGroup) {
        asabaGroup = myGroup.filter(gt => shareMap.has(gt) && (shareMap.get(gt)!.type === 'asaba'));
        break;
      }
    }
  }

  // fard_then_asaba: father/grandfather also get residue if any
  const fardThenAsaba = [...shareMap.entries()]
    .filter(([, e]) => e.type === 'fard_then_asaba')
    .map(([t]) => t);

  if (fardThenAsaba.length > 0 && residue > 0) {
    // Father/grandfather alone takes all residue
    for (const ft of fardThenAsaba) {
      const existingFard = amounts.get(ft) ?? 0;
      amounts.set(ft, existingFard + residue);
      residue = 0;
    }
  } else if (asabaGroup.length > 0 && residue > 0) {
    // Distribute residue: male gets 2x female (for paired groups)
    let maleUnits = 0, femaleUnits = 0;
    for (const gt of asabaGroup) {
      const def = AVAILABLE_HEIRS.find(d => d.type === gt);
      const c = activeHeirs.find(h => h.type === gt)?.count ?? 0;
      if (def?.gender === 'male') maleUnits += c * 2;
      else femaleUnits += c;
    }
    const totalUnits = maleUnits + femaleUnits;
    if (totalUnits > 0) {
      const unitValue = residue / totalUnits;
      for (const gt of asabaGroup) {
        const def = AVAILABLE_HEIRS.find(d => d.type === gt);
        const c = activeHeirs.find(h => h.type === gt)?.count ?? 0;
        const units = def?.gender === 'male' ? c * 2 : c;
        amounts.set(gt, (amounts.get(gt) ?? 0) + unitValue * units);
      }
    }
    residue = 0;
  }

  steps.push({
    stepNumber: 5,
    title: 'Distribute Asaba (Residue)',
    titleAr: 'توزيع الباقي (العصبة)',
    description: asabaGroup.length > 0 || fardThenAsaba.length > 0
      ? `Residue distributed to: ${[...asabaGroup,...fardThenAsaba].map(t=>getHeirLabel(t)).join(', ')} (males get 2× females)`
      : 'No Asaba heirs — surplus goes to Radd or Bait ul-Mal',
    descriptionAr: asabaGroup.length > 0 || fardThenAsaba.length > 0
      ? `الباقي يوزع على: ${[...asabaGroup,...fardThenAsaba].map(t=>getHeirLabelAr(t)).join('، ')} (للذكر مثل حظ الأنثيين)`
      : 'لا عصبة — الباقي يذهب للرد أو بيت المال',
  });

  // ── 8. Radd (if residue remains after fard only, no asaba) ──
  let raddApplied = false;
  let raddFactor = 1;
  let baitulmal = 0;

  const totalAfterAsaba = [...amounts.values()].reduce((s, v) => s + v, 0);
  const surplusAfterAsaba = Math.max(0, net - totalAfterAsaba);

  if (surplusAfterAsaba > 0.001 && asabaGroup.length === 0 && fardThenAsaba.length === 0) {
    // Determine who is eligible for Radd per madhab
    const spouseEligibleForRadd = (type: HeirType) => {
      if (type === 'wife') {
        return madhab === 'maliki' ? false : false; // no madhab gives wife Radd in standard view
      }
      if (type === 'husband') {
        return madhab === 'maliki'; // Maliki: husband can get Radd
      }
      return true;
    };

    const raddEligible = [...shareMap.entries()]
      .filter(([t, e]) => (e.type === 'fard' || e.type === 'fard_then_asaba') && amounts.has(t) && spouseEligibleForRadd(t) !== false)
      .filter(([t]) => !(['husband','wife'].includes(t)) || spouseEligibleForRadd(t))
      .map(([t]) => t);

    const spouseTypes: HeirType[] = ['husband','wife'];
    const nonSpouseRaddEligible = raddEligible.filter(t => !spouseTypes.includes(t));
    const eligibleForRadd = nonSpouseRaddEligible.length > 0 ? nonSpouseRaddEligible : raddEligible;

    if (eligibleForRadd.length > 0) {
      // Radd: distribute surplus proportionally to eligible heirs' original shares
      const eligibleTotal = eligibleForRadd.reduce((s, t) => s + (amounts.get(t) ?? 0), 0);
      if (eligibleTotal > 0) {
        for (const t of eligibleForRadd) {
          const orig = amounts.get(t) ?? 0;
          const raddShare = surplusAfterAsaba * (orig / eligibleTotal);
          amounts.set(t, orig + raddShare);
        }
        raddApplied = true;
        raddFactor = net / totalAfterAsaba;
        notes.push(`Radd applied: surplus ${surplusAfterAsaba.toFixed(2)} returned to ${eligibleForRadd.map(t=>getHeirLabel(t)).join(', ')}.`);
        notesAr.push(`تم تطبيق الرد: الباقي ${surplusAfterAsaba.toFixed(2)} رُدَّ على ${eligibleForRadd.map(t=>getHeirLabelAr(t)).join('، ')}.`);
      }
    } else {
      // All heirs are spouses only or none eligible → Bait ul-Mal
      baitulmal = surplusAfterAsaba;
      notes.push(`Surplus ${surplusAfterAsaba.toFixed(2)} goes to Bait ul-Mal (Public Treasury) as no Radd-eligible heirs exist.`);
      notesAr.push(`الباقي ${surplusAfterAsaba.toFixed(2)} يذهب لبيت المال لعدم وجود مستحقين للرد.`);
    }

    if (raddApplied) {
      steps.push({
        stepNumber: 6,
        title: 'Radd — Surplus Returned to Heirs',
        titleAr: 'الرد — رد الباقي على ذوي الفروض',
        description: `Surplus ${surplusAfterAsaba.toFixed(2)} returned proportionally. Madhab: ${madhab} (spouses ${nonSpouseRaddEligible.length > 0 ? 'excluded' : 'included if Maliki'}).`,
        descriptionAr: `الباقي ${surplusAfterAsaba.toFixed(2)} رُدَّ بالنسبة. المذهب: ${madhab}.`,
      });
    }
  }

  // ── 9. Build final share list ─────────────────────────────
  const finalAllocated = [...amounts.values()].reduce((s, v) => s + v, 0);

  const finalShares: HeirShare[] = [];

  // Active heirs with amounts
  for (const heir of activeHeirs) {
    const amount = amounts.get(heir.type) ?? 0;
    const entry = shareMap.get(heir.type);
    const def = AVAILABLE_HEIRS.find(d => d.type === heir.type);
    const percentage = net > 0 ? (amount / net) * 100 : 0;

    let fraction = '0';
    let quranicRef = '';
    let quranicText = '';
    let explanation = '';
    let explanationAr = '';
    let shareType: HeirShare['shareType'] = 'fard';

    if (entry?.type === 'asaba') {
      shareType = 'asaba';
      // Compute actual fraction from amount/net
      fraction = net > 0 ? ratioToFraction(amount / net) : '0';
      explanation = `Receives residue as Asaba (residuary heir). Males get 2× females.`;
      explanationAr = `يرث الباقي تعصيبًا. للذكر مثل حظ الأنثيين.`;
    } else if (entry?.type === 'fard_then_asaba') {
      shareType = 'fard_then_asaba';
      fraction = `1/6 + remainder`;
      quranicRef = 'An-Nisa 4:11';
      quranicText = 'وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ مِمَّا تَرَكَ إِن كَانَ لَهُ وَلَدٌ';
      explanation = `Fixed 1/6 share + residue as Asaba.`;
      explanationAr = `السدس فرضًا والباقي تعصيبًا.`;
    } else if (entry && entry.n > 0) {
      shareType = 'fard';
      fraction = fracStr(entry.n, entry.d);
      // Quranic references
      switch (heir.type) {
        case 'husband':
          quranicRef = 'An-Nisa 4:12';
          quranicText = 'وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَاجُكُمْ إِن لَّمْ يَكُن لَّهُنَّ وَلَدٌ';
          explanation = `Husband: ${hasDesc(activeTypes) ? '1/4 (with descendants)' : '1/2 (no descendants)'}`;
          explanationAr = `الزوج: ${hasDesc(activeTypes) ? 'الربع (مع الأولاد)' : 'النصف (بلا أولاد)'}`;
          break;
        case 'wife':
          quranicRef = 'An-Nisa 4:12';
          quranicText = 'وَلَهُنَّ الرُّبُعُ مِمَّا تَرَكْتُمْ إِن لَّمْ يَكُن لَّكُمْ وَلَدٌ';
          explanation = `Wife/Wives share ${hasDesc(activeTypes) ? '1/8' : '1/4'} split among ${heir.count} wife/wives`;
          explanationAr = `الزوجة/الزوجات يشتركن في ${hasDesc(activeTypes) ? 'الثمن' : 'الربع'} على ${heir.count}`;
          break;
        case 'daughter':
          quranicRef = 'An-Nisa 4:11';
          quranicText = 'فَإِن كُنَّ نِسَاءً فَوْقَ اثْنَتَيْنِ فَلَهُنَّ ثُلُثَا مَا تَرَكَ';
          explanation = heir.count === 1 ? '1 daughter: 1/2' : `${heir.count} daughters: share 2/3`;
          explanationAr = heir.count === 1 ? 'بنت واحدة: النصف' : `${heir.count} بنات: يشتركن في الثلثين`;
          break;
        case 'mother':
          quranicRef = 'An-Nisa 4:11';
          quranicText = 'وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ مِمَّا تَرَكَ إِن كَانَ لَهُ وَلَدٌ';
          explanation = isUmariyyatain ? '1/3 of remainder after spouse (Umariyyatain)' : entry.n === 1 && entry.d === 6 ? '1/6 (descendants or ≥2 siblings present)' : '1/3';
          explanationAr = isUmariyyatain ? 'ثلث الباقي بعد الزوج (عمريتين)' : entry.n === 1 && entry.d === 6 ? 'السدس (مع الأولاد أو أخوين فأكثر)' : 'الثلث';
          break;
        case 'paternalGrandmother':
        case 'maternalGrandmother':
          quranicRef = 'Hadith';
          explanation = '1/6 shared between grandmothers';
          explanationAr = 'السدس تشترك فيه الجدتان';
          break;
        case 'fullSister':
        case 'paternalSister':
          quranicRef = 'An-Nisa 4:176';
          quranicText = 'وَإِن كَانَت وَاحِدَةً فَلَهَا النِّصْفُ';
          explanation = heir.count === 1 ? '1 sister: 1/2' : `${heir.count} sisters: share 2/3`;
          explanationAr = heir.count === 1 ? 'أخت واحدة: النصف' : `${heir.count} أخوات: يشتركن في الثلثين`;
          break;
        case 'maternalBrother':
        case 'maternalSister':
          quranicRef = 'An-Nisa 4:12';
          explanation = count('maternalBrother') + count('maternalSister') === 1 ? '1/6 for single maternal sibling' : '1/3 shared among all maternal siblings equally';
          explanationAr = count('maternalBrother') + count('maternalSister') === 1 ? 'السدس لأخ/أخت واحد لأم' : 'الثلث بالتساوي لإخوة الأم';
          break;
        case 'sonsDaughter':
          quranicRef = 'An-Nisa 4:11';
          explanation = '1/6 completing 2/3 with daughter, or 1/2 alone';
          explanationAr = 'السدس تكملة للثلثين مع البنت، أو النصف منفردة';
          break;
        default:
          explanation = `Fixed share: ${fraction}`;
          explanationAr = `الفرض المقدر: ${fraction}`;
      }
    }

    if (raddApplied && amounts.has(heir.type)) {
      explanation += ' (Radd applied)';
      explanationAr += ' (مع الرد)';
    }

    // Compute per-person amounts for plural heirs (wives, daughters, siblings, etc.)
    let perPersonAmount: number | undefined;
    let perPersonFraction: string | undefined;
    if (heir.count > 1 && amount > 0 && !entry?.type?.startsWith('asaba')) {
      perPersonAmount = amount / heir.count;
      perPersonFraction = net > 0 ? ratioToFraction(perPersonAmount / net) : undefined;
      if (heir.type === 'wife') {
        const totalFrac = fraction;
        explanation += ` Shared equally: each wife gets ${perPersonFraction ?? (perPersonAmount / net * 100).toFixed(2) + '%'}`;
        explanationAr += ` يُقسَّم بالتساوي: كل زوجة تأخذ ${perPersonFraction ?? (perPersonAmount / net * 100).toFixed(2) + '%'}`;
        fraction = `${totalFrac} shared → each: ${perPersonFraction ?? (perPersonAmount / net * 100).toFixed(2) + '%'}`;
      }
    }

    finalShares.push({
      heir: { type: heir.type, name: isRtl(madhab) ? def?.labelAr ?? heir.name : def?.label ?? heir.name, count: heir.count },
      amount,
      fraction,
      percentage,
      shareType,
      explanation,
      explanationAr,
      blocked: false,
      quranicRef: quranicRef || undefined,
      quranicText: quranicText || undefined,
      perPersonAmount,
      perPersonFraction,
    });
  }

  // Blocked heirs
  for (const heir of blockedHeirs) {
    const blocker = getBlockedBy(heir.type, allTypes);
    const def = AVAILABLE_HEIRS.find(d => d.type === heir.type);
    const blockerDef = blocker ? AVAILABLE_HEIRS.find(d => d.type === blocker) : null;
    finalShares.push({
      heir: { type: heir.type, name: def?.label ?? heir.type, count: heir.count },
      amount: 0,
      fraction: '0',
      percentage: 0,
      shareType: 'blocked',
      explanation: `Blocked (Mahjub) by ${blockerDef?.label ?? blocker}`,
      explanationAr: `محجوب بسبب وجود ${blockerDef?.labelAr ?? blocker}`,
      blocked: true,
      blockReason: `Excluded by ${blockerDef?.label ?? blocker}`,
      blockReasonAr: `محجوب بـ ${blockerDef?.labelAr ?? blocker}`,
    });
  }

  // Check special cases
  let specialCase: string | undefined;
  let specialCaseAr: string | undefined;
  const hasHW = has('husband') || has('wife');
  const hasBothParents = has('father') && has('mother');
  if (hasHW && hasBothParents && !hasDesc(activeTypes)) {
    specialCase = 'Umariyyatain (العمريتان): Mother receives 1/3 of remainder after spouse, not 1/3 of total estate.';
    specialCaseAr = 'العمريتان: الأم ترث ثلث الباقي بعد نصيب الزوج/الزوجة لا ثلث التركة كاملها.';
  }

  // Musharraka (Himariyya)
  const isMusharraka = has('husband') && has('mother') && has('maternalBrother') &&
    (has('fullBrother') || has('fullSister')) && !hasDesc(activeTypes) && !has('father');
  if (isMusharraka) {
    specialCase = (specialCase ?? '') + ' | Musharraka (المشتركة): Full siblings share with maternal siblings in the 1/3.';
    specialCaseAr = (specialCaseAr ?? '') + ' | المشتركة (الحمارية): الإخوة الأشقاء يشاركون إخوة الأم في الثلث.';
    notes.push('Musharraka case: Full siblings share equally with maternal siblings (Shafi\'i/Maliki view).');
    notesAr.push('مسألة المشتركة: الإخوة الأشقاء يشاركون إخوة الأم في الثلث (مذهب الشافعي والمالكي).');
  }

  return {
    shares: finalShares,
    distributableEstate: net,
    totalAllocated: finalAllocated,
    awlApplied,
    raddApplied,
    awlFactor: awlApplied ? awlFactor : undefined,
    raddFactor: raddApplied ? raddFactor : undefined,
    notes,
    notesAr,
    steps,
    specialCase,
    specialCaseAr,
    baitulmal: baitulmal > 0 ? baitulmal : undefined,
  };
}

// helper for RTL check (not language, just for labelAr vs label in engine)
function isRtl(_: string): boolean { return false; }

export function validateHeirs(heirs: Heir[], deceasedGender: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const hasHusband = heirs.some(h => h.type === 'husband');
  const hasWife = heirs.some(h => h.type === 'wife');
  if (hasHusband && hasWife) errors.push({ severity: 'error', message: 'Cannot have both husband and wife', messageAr: 'لا يمكن وجود زوج وزوجة معاً' });
  if (deceasedGender === 'male' && hasHusband) errors.push({ severity: 'error', message: 'Deceased is male — cannot have husband as heir', messageAr: 'المتوفى ذكر — لا يرث الزوج' });
  if (deceasedGender === 'female' && hasWife) errors.push({ severity: 'error', message: 'Deceased is female — cannot have wife as heir', messageAr: 'المتوفاة أنثى — لا ترث الزوجة' });
  const wife = heirs.find(h => h.type === 'wife');
  if (wife && wife.count > 4) errors.push({ severity: 'error', message: 'Maximum 4 wives', messageAr: 'أقصى عدد للزوجات 4' });
  return errors;
}
