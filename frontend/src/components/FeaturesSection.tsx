import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: '📐',
    title: 'Precise Faraidh Engine',
    titleAr: 'محرك فرائض دقيق',
    desc: 'Implements all Quranic fixed shares with correct Awl, Radd, Hajb and Asaba residual rules.',
    descAr: 'يطبق جميع الأنصبة القرآنية مع قواعد العول والرد والحجب والعصبة.',
    verse: 'An-Nisa 4:11',
  },
  {
    icon: '⚖️',
    title: 'All Four Madhabs',
    titleAr: 'المذاهب الأربعة',
    desc: 'Hanafi, Maliki, Shafi\'i and Hanbali — each with their own rulings on surplus distribution.',
    descAr: 'حنفي، مالكي، شافعي، حنبلي — مع أحكام كل مذهب في الرد والحجب.',
    verse: 'An-Nisa 4:12',
  },
  {
    icon: '📖',
    title: 'Quranic References',
    titleAr: 'المراجع القرآنية',
    desc: 'Every share explained with its source verse from Surah An-Nisa and authenticated Sunnah.',
    descAr: 'كل نصيب مشروح بمصدره من سورة النساء والسنة النبوية الصحيحة.',
    verse: 'An-Nisa 4:176',
  },
  {
    icon: '🛡️',
    title: 'Blocking & Exclusion',
    titleAr: 'الحجب والإسقاط',
    desc: 'Full Hajb rules: hiram (total exclusion) and nuqsan (reduction). Murderer & non-Muslim exclusion.',
    descAr: 'قواعد الحجب الكاملة: حجب حرمان وحجب نقصان. استبعاد القاتل وغير المسلم.',
    verse: 'Hadith',
  },
  {
    icon: '📊',
    title: 'Visual Reports',
    titleAr: 'تقارير مرئية',
    desc: 'Pie charts, share tables, calculation steps — all printable as PDF.',
    descAr: 'مخططات دائرية، جداول الأنصبة، خطوات الحساب — قابلة للطباعة كـ PDF.',
    verse: '',
  },
  {
    icon: '🌐',
    title: 'Fully Bilingual',
    titleAr: 'ثنائي اللغة',
    desc: 'Complete Arabic & English UI with full RTL support and Arabic-Indic numerals.',
    descAr: 'واجهة عربية وإنجليزية كاملة مع دعم RTL والأرقام العربية الهندية.',
    verse: '',
  },
];

const FeaturesSection = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();

  return (
    <section id="features" dir={isRtl ? 'rtl' : 'ltr'} className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <div className={`mb-16 ${isRtl ? 'text-right' : 'text-center'}`}>
          <p className="text-accent font-arabic text-sm uppercase tracking-widest mb-3">
            {isRtl ? 'لماذا ميراث؟' : 'Why Mirath?'}
          </p>
          <h2 className="font-heading text-4xl font-bold text-foreground mb-4">
            {isRtl ? 'فقه الميراث، بتقنية حديثة' : 'Centuries of Fiqh, Modern Technology'}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {isRtl
              ? 'نجمع بين دقة الفقه الإسلامي وسهولة التكنولوجيا لخدمة المحامين والأسر.'
              : 'Combining Islamic jurisprudence precision with technology to serve lawyers and families.'}
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group luxury-card p-6 hover:border-accent/40 hover:shadow-md transition-all duration-300 animate-fade-in cursor-default"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 border border-accent/20 group-hover:border-accent/50 transition-colors"
                style={{ background: 'rgba(201,168,76,0.08)' }}>
                {f.icon}
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">
                {isRtl ? f.titleAr : f.title}
              </h3>
              {f.verse && (
                <p className="text-accent text-xs mb-2 font-arabic">{f.verse}</p>
              )}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {isRtl ? f.descAr : f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="rounded-3xl p-10 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #0f2044 0%, #071225 100%)' }}>
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.18) 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }} />
          <div className="relative z-10">
            <p className="text-[#c9a84c] font-arabic text-2xl mb-4">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
            <h3 className="text-white text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display',serif" }}>
              {isRtl ? 'ابدأ حساب الميراث الآن' : 'Start Your Inheritance Calculation'}
            </h3>
            <p className="text-white/50 mb-8 max-w-lg mx-auto text-sm">
              {isRtl
                ? 'مجاني تمامًا، يعمل بدون إنترنت، بياناتك محفوظة محليًا'
                : 'Completely free, works offline, your data stays local'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/calculator')}
                className="px-10 py-4 rounded-xl font-bold text-[#071225] text-base transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                style={{ background: 'linear-gradient(135deg,#f1d377,#c9a84c 50%,#9f7c26)' }}>
                {isRtl ? 'احسب الميراث' : 'Calculate Inheritance'}
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-10 py-4 rounded-xl font-semibold text-[#c9a84c] text-base border border-[#c9a84c]/40 transition-all hover:bg-[#c9a84c]/10">
                {isRtl ? 'سجّل مجاناً' : 'Register Free'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
