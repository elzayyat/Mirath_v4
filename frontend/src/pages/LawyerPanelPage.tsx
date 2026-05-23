import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import { Calculator, Briefcase, Plus, Eye } from 'lucide-react';

const statusColor: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Calculated: 'bg-accent/15 text-accent border-accent/20',
  Completed: 'bg-green-500/15 text-green-700',
};

const LawyerPanelPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const { data: cases = [], isLoading } = useCases();

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-4xl font-heading">{t('lawyer')} Panel</h1>
              <p className="text-muted-foreground text-sm mt-1">{user?.fullName || user?.email}</p>
            </div>
            <Button className="gold-gradient text-navy font-semibold" onClick={() => navigate('/calculator')}>
              <Plus className="w-4 h-4 me-2" />{isRtl ? 'قضية جديدة' : 'New Case'}
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cases list */}
            <Card className="luxury-card lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('cases')}</CardTitle>
                <Badge variant="outline">{cases.length}</Badge>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-accent" /></div>
                ) : cases.length === 0 ? (
                  <div className="text-center py-10">
                    <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">{isRtl ? 'لا توجد قضايا بعد' : 'No cases yet'}</p>
                    <Button size="sm" className="gold-gradient text-navy mt-4" onClick={() => navigate('/calculator')}>
                      {isRtl ? 'ابدأ قضية' : 'Start a case'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cases.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-accent/30 transition-all group">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{c.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.caseNumber && `${c.caseNumber} · `}{new Date(c.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ms-3">
                          <Badge variant="outline" className={`text-xs ${statusColor[c.status] ?? ''}`}>{c.status}</Badge>
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate(`/case/${c.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info panel */}
            <div className="space-y-4">
              <Card className="luxury-card">
                <CardHeader><CardTitle>{isRtl ? 'ملخص' : 'Summary'}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isRtl ? 'إجمالي القضايا' : 'Total cases'}</span>
                    <span className="font-bold">{cases.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isRtl ? 'محسوبة' : 'Calculated'}</span>
                    <span className="font-bold text-accent">{cases.filter((c:any) => c.status === 'Calculated').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isRtl ? 'مسودة' : 'Draft'}</span>
                    <span className="font-bold">{cases.filter((c:any) => c.status === 'Draft').length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="luxury-card">
                <CardHeader><CardTitle>{isRtl ? 'إجراءات' : 'Actions'}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full gold-gradient text-navy font-semibold" onClick={() => navigate('/calculator')}>
                    <Calculator className="w-4 h-4 me-2" />{isRtl ? 'حساب جديد' : 'New Calculation'}
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => navigate('/dashboard')}>
                    {isRtl ? 'لوحة التحكم' : 'Dashboard'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LawyerPanelPage;
