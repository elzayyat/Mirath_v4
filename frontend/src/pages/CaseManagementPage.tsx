import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCase } from '@/hooks/useCases';
import { useTranslation } from 'react-i18next';

const CaseManagementPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { data, isLoading } = useCase(id);

  if (isLoading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mt-8" /></div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 text-center">
        <p className="text-muted-foreground">{isRtl ? 'القضية غير موجودة' : 'Case not found'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/client')}>{isRtl ? 'العودة' : 'Back'}</Button>
      </div><Footer />
    </div>
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Button>
            <h1 className="text-3xl font-heading">{data.case.title}</h1>
          </div>
          <Card className="luxury-card">
            <CardHeader><CardTitle>{isRtl ? 'تفاصيل القضية' : 'Case Details'}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2"><span className="text-muted-foreground w-32">{isRtl ? 'المتوفى' : 'Deceased'}:</span><span className="font-medium">{data.case.deceased_name || '—'}</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground w-32">{isRtl ? 'الحالة' : 'Status'}:</span><span className="font-medium">{data.case.status}</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground w-32">{isRtl ? 'المذهب' : 'Madhab'}:</span><span className="font-medium capitalize">{data.case.madhab ?? 'Hanafi'}</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground w-32">{isRtl ? 'التاريخ' : 'Created'}:</span><span className="font-medium">{new Date(data.case.created_at).toLocaleDateString()}</span></div>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button className="gold-gradient text-navy" onClick={() => navigate(`/case/${id}`)}>
              <Eye className="w-4 h-4 me-2" />{isRtl ? 'عرض النتائج' : 'View Results'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/client')}>{isRtl ? 'العودة' : 'Back'}</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CaseManagementPage;
