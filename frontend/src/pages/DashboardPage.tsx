import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useNumbers } from '@/contexts/NumberContext';
import { useCases } from '@/hooks/useCases';
import { mockStore } from '@/lib/mockStore';
import {
  Briefcase, Calculator, Users, TrendingUp, Eye,
  Plus, BarChart3, FileText, Shield, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#64748b',
  Calculated: '#c9a84c',
  Completed: '#2d8a5a',
  Archived: '#94a3b8',
};
const MADHAB_COLORS = ['#c9a84c','#1e4d8c','#2d8a5a','#c0392b','#8e44ad'];

const statusBadge: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Calculated: 'bg-accent/15 text-accent border-accent/20',
  Completed: 'bg-green-500/15 text-green-700 border-green-500/20',
  Archived: 'bg-muted text-muted-foreground',
};

// Skeleton loader
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-muted/60 rounded-xl ${className ?? ''}`} />
);

const DashboardPage = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { formatNumber } = useNumbers();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const { data: cases = [], isLoading } = useCases();

  // Use getStats for analytics
  const stats = mockStore.getStats(user?.id);

  // Chart data
  const statusChartData = Object.entries(stats.casesByStatus).map(([name, value]) => ({ name, value }));
  const madhabChartData = Object.entries(stats.casesByMadhab).map(([name, value], i) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: MADHAB_COLORS[i % MADHAB_COLORS.length],
  }));

  const thisMonthDelta = stats.thisMonthCases - stats.lastMonthCases;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-heading">{t('dashboard')}</h1>
              <p className="text-muted-foreground mt-1 text-sm">{user?.fullName || user?.email}</p>
            </div>
            <Badge className="gold-gradient text-navy px-4 py-1.5 text-sm">{user?.role}</Badge>
          </div>

          {/* ── KPI ROW ── */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {/* Total Cases */}
              <Card className="luxury-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-accent" />
                    </div>
                    {thisMonthDelta !== 0 && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${thisMonthDelta > 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                        {thisMonthDelta > 0 ? '+' : ''}{thisMonthDelta} {isRtl ? 'هذا الشهر' : 'this month'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'إجمالي القضايا' : 'Total Cases'}</p>
                  <p className="text-3xl font-heading">{formatNumber(stats.totalCases)}</p>
                </CardContent>
              </Card>

              {/* Calculated Cases */}
              <Card className="luxury-card">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                    <Calculator className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'القضايا المحسوبة' : 'Calculated Cases'}</p>
                  <p className="text-3xl font-heading">{formatNumber(stats.calculatedCases)}</p>
                  {stats.totalCases > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {((stats.calculatedCases / stats.totalCases) * 100).toFixed(0)}% {isRtl ? 'من الإجمالي' : 'of total'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Total Heirs */}
              <Card className="luxury-card">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'إجمالي الورثة' : 'Total Heirs'}</p>
                  <p className="text-3xl font-heading">{formatNumber(stats.totalHeirsCalculated)}</p>
                </CardContent>
              </Card>

              {/* Total Estate Value */}
              <Card className="luxury-card">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'قيمة التركات' : 'Total Estate Value'}</p>
                  <p className="text-2xl font-heading">{formatNumber(stats.totalEstateManaged)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── CHARTS ROW ── */}
          {!isLoading && stats.totalCases > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Cases by Status — Bar chart */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-base">{isRtl ? 'القضايا حسب الحالة' : 'Cases by Status'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer>
                      <BarChart data={statusChartData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {statusChartData.map((entry, i) => (
                            <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#c9a84c'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cases by Madhab — Pie chart */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-base">{isRtl ? 'القضايا حسب المذهب' : 'Cases by Madhab'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={madhabChartData}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {madhabChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── BOTTOM ROW ── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Recent Cases Table — 2/3 width */}
            <Card className="luxury-card lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{isRtl ? 'القضايا الأخيرة' : 'Recent Cases'}</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => navigate('/client')} className="text-accent">
                  {isRtl ? 'عرض الكل' : 'View all'} <ChevronRight className="w-4 h-4 ms-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : cases.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">{isRtl ? 'لا توجد قضايا بعد' : 'No cases yet'}</p>
                    <p className="text-muted-foreground text-xs mb-4">{isRtl ? 'ابدأ حساباً لتظهر القضايا هنا' : 'Start a calculation to see cases here'}</p>
                    <Button size="sm" className="gold-gradient text-navy" onClick={() => navigate('/calculator')}>
                      <Plus className="w-3.5 h-3.5 me-1" />{isRtl ? 'ابدأ حساباً جديداً' : 'Start a Calculation'}
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="text-start py-2 px-2">{isRtl ? 'الرقم' : 'Case #'}</th>
                          <th className="text-start py-2 px-2">{isRtl ? 'المتوفى' : 'Deceased'}</th>
                          <th className="text-start py-2 px-2 hidden sm:table-cell">{isRtl ? 'التركة' : 'Estate'}</th>
                          <th className="text-start py-2 px-2 hidden md:table-cell">{isRtl ? 'المذهب' : 'Madhab'}</th>
                          <th className="text-start py-2 px-2">{isRtl ? 'الحالة' : 'Status'}</th>
                          <th className="text-start py-2 px-2 hidden sm:table-cell">{isRtl ? 'التاريخ' : 'Date'}</th>
                          <th className="py-2 px-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {cases.slice(0, 7).map(c => (
                          <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-2 font-mono text-xs text-muted-foreground">{c.caseNumber}</td>
                            <td className="py-2.5 px-2 font-medium">{c.deceased_name || c.title}</td>
                            <td className="py-2.5 px-2 text-muted-foreground hidden sm:table-cell">{c.total_estate ? formatNumber(c.total_estate) : '—'}</td>
                            <td className="py-2.5 px-2 capitalize text-xs text-muted-foreground hidden md:table-cell">{c.madhab || '—'}</td>
                            <td className="py-2.5 px-2">
                              <Badge variant="outline" className={`text-xs ${statusBadge[c.status] ?? ''}`}>{c.status}</Badge>
                            </td>
                            <td className="py-2.5 px-2 text-xs text-muted-foreground hidden sm:table-cell">{new Date(c.created_at).toLocaleDateString()}</td>
                            <td className="py-2.5 px-2">
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/case/${c.id}`)} className="h-7 w-7 p-0">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right column — Quick Actions + Subscription */}
            <div className="space-y-4">
              {/* Quick Actions */}
              <Card className="luxury-card">
                <CardHeader><CardTitle>{t('quickActions')}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full gold-gradient text-navy font-semibold" onClick={() => navigate('/calculator')}>
                    <Calculator className="w-4 h-4 me-2" />{isRtl ? 'حساب جديد' : 'New Calculation'}
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => navigate('/client')}>
                    <Briefcase className="w-4 h-4 me-2" />{t('viewCases')}
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => navigate('/reports')}>
                    <BarChart3 className="w-4 h-4 me-2" />{t('reports')}
                  </Button>
                  {user?.role === 'Admin' && (
                    <Button className="w-full" variant="outline" onClick={() => navigate('/admin')}>
                      <Shield className="w-4 h-4 me-2" />{isRtl ? 'لوحة الإدارة' : 'Admin Panel'}
                    </Button>
                  )}
                  {user?.role === 'Lawyer' && (
                    <Button className="w-full" variant="outline" onClick={() => navigate('/lawyer')}>
                      <Briefcase className="w-4 h-4 me-2" />{isRtl ? 'لوحة المحامي' : 'Lawyer Panel'}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Subscription / Plan card */}
              {user?.subscription && (
                <Card className="luxury-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{isRtl ? 'خطتك' : 'Your Plan'}</p>
                        <p className="font-semibold text-sm">{user.subscription.planName}</p>
                      </div>
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    {user.subscription.monthlyCaseLimit && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>{isRtl ? 'القضايا المستخدمة' : 'Cases used'}</span>
                          <span>{user.subscription.casesUsedThisPeriod} / {user.subscription.monthlyCaseLimit}</span>
                        </div>
                        <div className="h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all"
                            style={{ width: `${Math.min(100, ((user.subscription.casesUsedThisPeriod ?? 0) / user.subscription.monthlyCaseLimit) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1 mt-3">
                      {[
                        { label: isRtl ? 'الحاسبة المتقدمة' : 'Advanced Calculator', val: user.subscription.hasAdvancedCalculator },
                        { label: isRtl ? 'تصدير PDF' : 'PDF Exports', val: user.subscription.hasPdfExports },
                        { label: isRtl ? 'إدارة العملاء' : 'Client Mgmt', val: user.subscription.hasClientManagement },
                      ].map(f => (
                        <div key={f.label} className="flex items-center gap-2 text-xs">
                          <span className={f.val ? 'text-green-500' : 'text-muted-foreground/40'}>
                            {f.val ? '✓' : '✗'}
                          </span>
                          <span className={f.val ? 'text-foreground' : 'text-muted-foreground/50'}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
