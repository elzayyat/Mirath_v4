import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

type Language = 'en' | 'ar';
type Dir = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  dir: Dir;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.title': 'Mirath - Islamic Inheritance Calculator',
    'nav.home': 'Home',
    'nav.calculator': 'Calculator',
    'nav.about': 'About',
    'estate.info': 'Estate Information',
    'estate.deceasedName': 'Deceased Name',
    'estate.gender': 'Gender of Deceased',
    'estate.totalEstate': 'Total Estate Value',
    'estate.debts': 'Debts',
    'estate.funeral': 'Funeral Expenses',
    'estate.bequests': 'Bequests / Will',
    'heirs.select': 'Select Heirs',
    'calculate': 'Calculate Shares',
    'results': 'Results',
  },
  ar: {
    'app.title': '????? - ????? ??????? ?????????',
    'nav.home': '????????',
    'nav.calculator': '???????',
    'nav.about': '?? ??????',
    'estate.info': '??????? ??????',
    'estate.deceasedName': '??? ???????',
    'estate.gender': '??? ???????',
    'estate.totalEstate': '???? ?????? ?????????',
    'estate.debts': '??????',
    'estate.funeral': '?????? ???????',
    'estate.bequests': '??????',
    'heirs.select': '?????? ??????',
    'calculate': '???? ???????',
    'results': '???????',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language | null;
    return saved || 'en';
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key: string): string => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, dir, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
