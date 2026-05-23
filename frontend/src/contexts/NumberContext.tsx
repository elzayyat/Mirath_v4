import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type NumberContextValue = { useArabicIndic: boolean; setUseArabicIndic: (v: boolean) => void; formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string };
const NumberContext = createContext<NumberContextValue | undefined>(undefined);

export function NumberProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [useArabicIndic, setUseArabicIndicState] = useState(localStorage.getItem('mirath_arabic_indic_numbers') === 'true');
  const setUseArabicIndic = (v: boolean) => { localStorage.setItem('mirath_arabic_indic_numbers', String(v)); setUseArabicIndicState(v); };
  useEffect(() => {}, [i18n.language, useArabicIndic]);
  const value = useMemo<NumberContextValue>(() => ({
    useArabicIndic,
    setUseArabicIndic,
    formatNumber: (n, options) => new Intl.NumberFormat(i18n.language === 'ar' && useArabicIndic ? 'ar-EG-u-nu-arab' : 'en-US', options).format(n),
  }), [i18n.language, useArabicIndic]);
  return <NumberContext.Provider value={value}>{children}</NumberContext.Provider>;
}
export const useNumbers = () => { const c = useContext(NumberContext); if (!c) throw new Error('useNumbers must be used inside NumberProvider'); return c; };
