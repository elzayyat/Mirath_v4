import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Shield, Briefcase, Calculator, FileText, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import { useTranslation } from 'react-i18next';
import { useNumbers } from '@/contexts/NumberContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const PIE_COLORS = ['#c9a84c','#1e4d8c','#2d8a5a','#c0392b','#8e44ad','#16a085'];

const ReportsPage = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { formatNumber } = useNumbers();
  const isRtl = i18n.language === 'ar';
  const { data: cases = [] } = useCases();

  if (!user) return null;

  const calculated = cases.filter((c: any) => c.status === 'Calculated' || c.status === 'Completed');
  const draft = cases.filter((c: any) => c.status === 'Draft');

  const statusData = [
    { name: 'Calculated', value: calculated.length, fill: '#c9a84c' },
    { name: 'Draft', value: draft.length, fill: '#1e4d8c' },
  ].filter(d => d.value > 0);

  const capabilityRows = [
    { label: isRtl ? 'الحاسبة المتقدمة' : 'Advanced Calculator', value: user.subscription?.hasAdvancedCalculator ? (isRtl ? 'مفعّل' : 'Enabled') : (isRtl ? 'أساسي' : 'Standard only'), icon: Calculator, ok: user.subscription?.hasAdvancedCalculator },
    { label: isRtl ? 'تصدير PDF' : 'PDF Exports', value: user.subscription?.hasPdfExports ? (isRtl ? 'مفعّل' : 'Enabled') : (isRtl ? 'يتطلب ترقية' : 'Upgrade required'), icon: FileText, ok: user.subscription?.hasPdfExports },
    { label: isRtl ? 'إدارة العملاء' : 'Client Management', value: user.subscription?.hasClientManagement ? (isRtl ? 'مفعّل' : 'Enabled') : (isRtl ? 'يتطلب ترقية' : 'Upgrade required'), icon: Briefcase, ok: user.subscription?.hasClientManagement },
    { label: isRtl ? 'تحليلات المدير' : 'Admin Analytics', value: user.subscription?.hasAdminAccess ? (isRtl ? 'مفعّل' : 'Enabled') : (isRtl ? 'مقيّد' : 'Restricted'), icon: Shield, ok: user.subscription?.hasAdminAccess },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-6xl mx-auto space-y-6">

          <div>
            <h1 className="text-4xl font-heading">{t('reports')}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{isRtl ? 'التقارير والتحليلات' : 'Analytics & Reporting'}</p>
          </div>

          {/* Account overview */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="luxury-card">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{isRtl ? 'الخطة' : 'Plan'}</p>
                <p className="text-2xl font-heading">{user.subscription?.planName || 'Standard'}</p>
              </CardContent>
            </Card>
            <Card className="luxury-card">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{isRtl ? 'الدور' : 'Role'}</p>
                <p className="text-2xl font-heading">{user.role}</p>
              </CardContent>
            </Card>
            <Card className="luxury-card">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{isRtl ? 'إجمالي القضايا' : 'Total Cases'}</p>
                <p className="text-2xl font-heading">{formatNumber(cases.length)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Cases chart */}
            {cases.length > 0 && (
              <Card className="luxury-card">
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-accent" />{isRtl ? 'توزيع القضايا' : 'Cases by Status'}</CardTitle></CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <div className="h-52">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} label={({name,value})=>`${name}: ${value}`}>
                            {statusData.map((d,i)=><Cell key={i} fill={d.fill} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">{isRtl ? 'لا توجد بيانات' : 'No data yet'}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Access matrix */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-accent" />{isRtl ? 'مصفوفة الصلاحيات' : 'Access Matrix'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {capabilityRows.map(row => (
                  <div key={row.label} className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      <row.icon className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">{row.label}</span>
                    </div>
                    <Badge variant="outline" className={row.ok ? 'text-green-600 border-green-500/30' : 'text-muted-foreground'}>
                      {row.value}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Usage */}
          {user.subscription?.monthlyCaseLimit && (
            <Card className="luxury-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-4 h-4 text-accent" />{isRtl ? 'الاستخدام الشهري' : 'Monthly Usage'}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{isRtl ? 'القضايا المستخدمة' : 'Cases used'}</span>
                  <span className="font-bold">{user.subscription.casesUsedThisPeriod ?? 0} / {user.subscription.monthlyCaseLimit}</span>
                </div>
                <div className="h-3 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((user.subscription.casesUsedThisPeriod ?? 0) / user.subscription.monthlyCaseLimit) * 100)}%` }} />
                </div>
                {user.subscription.usagePeriodEnd && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {isRtl ? 'ينتهي' : 'Resets'}: {new Date(user.subscription.usagePeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground text-center">
            {isRtl
              ? 'هذه التقارير للأغراض التعليمية. استشر عالماً أو محامياً مؤهلاً للقرارات الملزمة.'
              : 'These reports are for educational purposes. Consult a qualified scholar or attorney for binding decisions.'}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportsPage;
