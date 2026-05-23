import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { applyLanguageDirection } from '@/i18n';
import { Eye, EyeOff, Lock, Mail, User, Phone, ChevronRight, Scale } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [nameEnglish, setNameEnglish] = useState('');
  const [nameArabic, setNameArabic] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Client');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const switchLang = async () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', next);
    localStorage.setItem('mirath_language', next);
    await i18n.changeLanguage(next);
    applyLanguageDirection(next);
  };

  const getErrMsg = (e: unknown) => {
    const msg = (e as any)?.message?.toLowerCase() ?? '';
    if (msg.includes('already registered') || msg.includes('already exists')) return isRtl ? 'البريد الإلكتروني مسجل مسبقًا' : 'Email already registered.';
    if (msg.includes('invalid email or password') || msg.includes('unauthorized')) return isRtl ? 'البريد أو كلمة المرور غير صحيحة' : 'Invalid email or password.';
    if (msg.includes('password')) return isRtl ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters.';
    return isRtl ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password.length < 8) {
      toast({ title: t('error'), description: isRtl ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = isLogin
      ? await login(email, password)
      : await register({ email, password, nameEnglish, nameArabic, phone, role });
    setLoading(false);
    if (error) {
      toast({ title: t('error'), description: getErrMsg(error), variant: 'destructive' });
      return;
    }
    toast({ title: t('success'), description: isLogin ? t('loginSuccess') : t('registrationSuccess') });
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#0a1628] flex">
      {/* Left panel - brand */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden p-12">
        {/* Background layers */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 15% 20%, rgba(201,168,76,0.18) 0%, transparent 55%), linear-gradient(145deg, #0f2044 0%, #071225 100%)'
        }} />
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.4) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full border border-[#c9a84c]/10" />
        <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full border border-[#c9a84c]/15" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full border border-[#c9a84c]/10" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[#071225] text-lg" style={{ background: 'linear-gradient(135deg,#f1d377,#c9a84c 50%,#9f7c26)' }}>م</div>
            <span className="text-white font-bold text-xl tracking-wide">Mirath</span>
            <span className="text-[#c9a84c] font-arabic text-lg">ميراث</span>
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-[#c9a84c] font-arabic text-3xl mb-4">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
              <h1 className="text-white text-4xl xl:text-5xl font-bold leading-tight font-heading">
                Inheritance justice,<br/>
                <span className="text-[#c9a84c]">calculated with</span><br/>
                legal precision.
              </h1>
            </div>

            {/* Quran verse */}
            <div className="rounded-2xl p-6 border border-[#c9a84c]/20" style={{ background: 'rgba(201,168,76,0.06)' }}>
              <p className="text-white/90 font-arabic text-xl leading-loose text-right mb-3">
                "لِّلرِّجَالِ نَصِيبٌ مِّمَّا تَرَكَ الْوَالِدَانِ وَالْأَقْرَبُونَ وَلِلنِّسَاءِ نَصِيبٌ مِّمَّا تَرَكَ الْوَالِدَانِ وَالْأَقْرَبُونَ"
              </p>
              <p className="text-[#c9a84c] text-sm text-right">— سورة النساء، آية ٧</p>
              <p className="text-white/60 text-sm mt-2 italic">
                "For men is a share of what parents and close relatives leave, and for women is a share..."
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[['120+', isRtl ? 'محامٍ' : 'Lawyers'], ['4', isRtl ? 'مذاهب' : 'Madhabs'], ['2', isRtl ? 'لغات' : 'Languages']].map(([v, l]) => (
                <div key={l} className="rounded-xl p-4 text-center border border-[#c9a84c]/20" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-[#c9a84c] text-2xl font-bold">{v}</div>
                  <div className="text-white/60 text-xs mt-1">{l}</div>
                </div>
              ))}
            </div>

            <p className="text-white/50 text-sm">
              {isRtl ? 'موثوق من قِبَل كبار المحامين والمكاتب العائلية' : 'Trusted by leading lawyers and family offices across the region.'}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-white/30 text-xs">
          <Scale className="w-3.5 h-3.5" />
          {isRtl ? 'للأغراض التعليمية — استشر عالمًا مؤهلاً للقرارات الملزمة.' : 'For educational use — consult a qualified scholar for binding decisions.'}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative" style={{ background: 'linear-gradient(160deg, #0d1d3a 0%, #0a1628 100%)' }}>
        {/* Top bar */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <button onClick={switchLang} className="text-white/50 hover:text-[#c9a84c] text-sm transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#c9a84c]/30">
            {i18n.language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[#071225] text-sm" style={{ background: 'linear-gradient(135deg,#f1d377,#c9a84c 50%,#9f7c26)' }}>م</div>
            <span className="text-white font-bold">Mirath</span>
          </div>

          <div className="mb-8">
            <h2 className="text-white text-3xl font-bold mb-2">
              {isLogin ? (isRtl ? 'مرحباً بعودتك' : 'Welcome back') : (isRtl ? 'إنشاء حساب' : 'Create account')}
            </h2>
            <p className="text-white/40 text-sm">
              {isLogin
                ? (isRtl ? 'أدخل بياناتك للدخول إلى حسابك' : 'Enter your credentials to access your account')
                : (isRtl ? 'أنشئ حسابًا للوصول إلى نظام الميراث' : 'Sign up to access the inheritance system')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-white/60 text-xs uppercase tracking-wide">{isRtl ? 'الاسم بالإنجليزية' : 'Name (EN)'}</label>
                    <div className="relative">
                      <User className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-white/30" />
                      <input
                        value={nameEnglish} onChange={e => setNameEnglish(e.target.value)}
                        placeholder="Ahmed Ali" required
                        className="w-full bg-white/5 border border-white/10 rounded-xl ps-10 pe-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/8 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-white/60 text-xs uppercase tracking-wide">{isRtl ? 'الاسم بالعربية' : 'Name (AR)'}</label>
                    <input
                      value={nameArabic} onChange={e => setNameArabic(e.target.value)}
                      placeholder="أحمد علي" dir="rtl"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs uppercase tracking-wide">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-white/30" />
                    <input
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+20 10 0000 0000" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl ps-10 pe-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs uppercase tracking-wide">{isRtl ? 'نوع الحساب' : 'Account type'}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Client', 'Lawyer'] as UserRole[]).map(r => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${role === r
                          ? 'border-[#c9a84c] text-[#c9a84c]'
                          : 'border-white/10 text-white/40 hover:border-white/20'}`}
                        style={role === r ? { background: 'rgba(201,168,76,0.1)' } : { background: 'rgba(255,255,255,0.03)' }}
                      >
                        {r === 'Client' ? (isRtl ? 'عميل' : 'Client') : (isRtl ? 'محامي' : 'Lawyer')}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-white/60 text-xs uppercase tracking-wide">{isRtl ? 'البريد الإلكتروني' : 'Email address'}</label>
              <div className="relative">
                <Mail className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-white/30" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl ps-10 pe-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-white/60 text-xs uppercase tracking-wide">{isRtl ? 'كلمة المرور' : 'Password'}</label>
              <div className="relative">
                <Lock className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-white/30" />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={isRtl ? '٨ أحرف على الأقل' : 'At least 8 characters'} required minLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl ps-10 pe-10 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute top-1/2 -translate-y-1/2 end-3 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-[#071225] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{ background: loading ? '#9f7c26' : 'linear-gradient(135deg,#f1d377 0%,#c9a84c 50%,#9f7c26 100%)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#071225]/30 border-t-[#071225] rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? (isRtl ? 'تسجيل الدخول' : 'Sign in') : (isRtl ? 'إنشاء حساب' : 'Create account')}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-white/30 text-sm">{isLogin ? (isRtl ? 'ليس لديك حساب؟' : "Don't have an account?") : (isRtl ? 'لديك حساب بالفعل؟' : 'Already have an account?')}</span>
            {' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-[#c9a84c] text-sm font-semibold hover:underline">
              {isLogin ? (isRtl ? 'أنشئ حسابًا' : 'Create account') : (isRtl ? 'تسجيل الدخول' : 'Sign in')}
            </button>
          </div>

          {/* Demo hint */}
          <div className="mt-8 p-4 rounded-xl border border-[#c9a84c]/20 text-center" style={{ background: 'rgba(201,168,76,0.04)' }}>
            <p className="text-white/40 text-xs mb-1">{isRtl ? '🔓 وضع التجربة المستقلة' : '🔓 Standalone demo mode'}</p>
            <p className="text-white/25 text-xs">
              {isRtl ? 'يعمل بدون خادم خلفي — البيانات محفوظة محليًا' : 'Works without a backend — data saved locally'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
