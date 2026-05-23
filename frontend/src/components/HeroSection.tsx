import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Scale } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #071225 0%, #0f2044 50%, #0a1a36 100%)' }}
    >
      {/* Dot-grid pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.22) 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />
      {/* Glow blobs */}
      <div className="absolute top-[-120px] right-[-120px] w-[480px] h-[480px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 70%)' }} />

      {/* Decorative rings */}
      <div className="absolute top-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full border border-[#c9a84c]/10" />
      <div className="absolute top-[-20px] right-[-20px] w-[180px] h-[180px] rounded-full border border-[#c9a84c]/16" />
      <div className="absolute bottom-[-40px] left-[-40px] w-[220px] h-[220px] rounded-full border border-[#c9a84c]/10" />

      <div className="relative z-10 container mx-auto max-w-6xl px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT — Text */}
          <div className={`space-y-8 ${isRtl ? 'text-right' : ''}`}>
            {/* Logo mark */}
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-[#071225] text-xl shadow-lg"
                style={{ background: 'linear-gradient(135deg,#f1d377,#c9a84c 50%,#9f7c26)' }}>م</div>
              <div>
                <span className="text-white font-bold text-2xl tracking-wide">Mirath</span>
                <span className="text-[#c9a84c] font-arabic text-lg ms-2">ميراث</span>
              </div>
            </div>

            {/* Bismillah */}
            <p className="text-[#c9a84c] font-arabic text-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </p>

            {/* Headline */}
            <h1 className="text-white text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight animate-fade-in"
              style={{ fontFamily: "'Playfair Display', serif", animationDelay: '0.2s' }}>
              {isRtl ? (
                <>عدالة الميراث،<br /><span style={{ color: '#c9a84c' }}>محسوبة بدقة</span><br />قانونية.</>
              ) : (
                <>Inheritance justice,<br /><span style={{ color: '#c9a84c' }}>calculated with</span><br />legal precision.</>
              )}
            </h1>

            {/* Quranic verse */}
            <div className="rounded-2xl p-5 border border-[#c9a84c]/20 animate-fade-in"
              style={{ background: 'rgba(201,168,76,0.06)', animationDelay: '0.3s' }}>
              <p className="text-white/90 font-arabic text-lg leading-loose text-right mb-2">
                "لِّلرِّجَالِ نَصِيبٌ مِّمَّا تَرَكَ الْوَالِدَانِ وَالْأَقْرَبُونَ وَلِلنِّسَاءِ نَصِيبٌ مِّمَّا تَرَكَ الْوَالِدَانِ وَالْأَقْرَبُونَ"
              </p>
              <p className="text-[#c9a84c] text-sm text-right mb-2">— سورة النساء، آية ٧</p>
              <p className="text-white/50 text-sm italic">
                "For men is a share of what parents and close relatives leave, and for women is a share..."
              </p>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-3 gap-4 animate-fade-in ${isRtl ? 'text-center' : ''}`} style={{ animationDelay: '0.4s' }}>
              {[
                ['120+', isRtl ? 'محامٍ' : 'Lawyers'],
                ['4', isRtl ? 'مذاهب' : 'Madhabs'],
                ['2', isRtl ? 'لغات' : 'Languages'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl p-4 text-center border border-[#c9a84c]/20"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-[#c9a84c] text-2xl font-bold">{v}</div>
                  <div className="text-white/50 text-xs mt-1">{l}</div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 animate-fade-in ${isRtl ? 'sm:flex-row-reverse' : ''}`} style={{ animationDelay: '0.5s' }}>
              <button
                onClick={() => navigate('/calculator')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#071225] text-base transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                style={{ background: 'linear-gradient(135deg,#f1d377 0%,#c9a84c 50%,#9f7c26 100%)' }}
              >
                {isRtl ? 'ابدأ الحساب' : 'Start Calculation'}
                <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#c9a84c] text-base border border-[#c9a84c]/40 transition-all hover:bg-[#c9a84c]/10"
              >
                {isRtl ? 'إنشاء حساب' : 'Create Account'}
              </button>
            </div>

            <div className={`flex items-center gap-2 text-white/30 text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Scale className="w-3.5 h-3.5 shrink-0" />
              {isRtl
                ? 'للأغراض التعليمية — استشر عالمًا مؤهلاً للقرارات الملزمة.'
                : 'For educational use — consult a qualified scholar for binding decisions.'}
            </div>
          </div>

          {/* RIGHT — Feature cards */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { icon: '📐', title: isRtl ? 'حسابات دقيقة' : 'Precise Calculations', sub: isRtl ? 'فرائض، عصبة، حجب، عول، رد' : 'Faraidh, Asaba, Hajb, Awl, Radd' },
              { icon: '⚖️', title: isRtl ? 'أربعة مذاهب' : 'Four Madhabs', sub: isRtl ? 'حنفي، مالكي، شافعي، حنبلي' : 'Hanafi, Maliki, Shafi\'i, Hanbali' },
              { icon: '📖', title: isRtl ? 'مراجع قرآنية' : 'Quranic References', sub: isRtl ? 'سورة النساء والسنة المطهرة' : 'Surah An-Nisa & authenticated Sunnah' },
              { icon: '🔒', title: isRtl ? 'وضع مستقل' : 'Standalone Mode', sub: isRtl ? 'يعمل بدون خادم — بيانات محلية' : 'Works offline — data stays local' },
              { icon: '🌐', title: isRtl ? 'ثنائي اللغة' : 'Bilingual', sub: isRtl ? 'عربي وإنجليزي مع RTL كامل' : 'Arabic & English with full RTL' },
              { icon: '📊', title: isRtl ? 'تقارير مفصلة' : 'Detailed Reports', sub: isRtl ? 'مخططات وجداول قابلة للطباعة' : 'Charts & printable share tables' },
            ].map((f, i) => (
              <div key={i}
                className="rounded-2xl p-5 border border-[#c9a84c]/15 animate-fade-in hover:border-[#c9a84c]/35 transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)', animationDelay: `${0.2 + i * 0.1}s` }}>
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to top, hsl(var(--background)), transparent)' }} />
    </section>
  );
};

export default HeroSection;
