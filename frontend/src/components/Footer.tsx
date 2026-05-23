import React from 'react';

const Footer = () => (
  <footer className="py-10 px-6 border-t border-border">
    <div className="container mx-auto max-w-6xl text-center">
      <p className="font-arabic text-2xl text-gold mb-2">ميراث</p>
      <p className="text-muted-foreground text-sm">
        Mirath — Islamic Inheritance Calculator
      </p>
      <p className="text-muted-foreground text-xs mt-2">
        Based on the Holy Quran (Surah An-Nisa 4:11-12, 4:176) and authenticated Sunnah
      </p>
      <p className="text-muted-foreground/60 text-xs mt-4">
        © {new Date().getFullYear()} Mirath. For educational purposes — consult a qualified scholar for binding decisions.
      </p>
    </div>
  </footer>
);

export default Footer;
