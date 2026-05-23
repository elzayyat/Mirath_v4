import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useCases, useDeleteCase } from '@/hooks/useCases';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Trash2, Eye, Search, Plus } from 'lucide-react';

const statusColor: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Calculated: 'bg-accent/15 text-accent border-accent/20',
  Completed: 'bg-green-500/15 text-green-700',
  Archived: 'bg-muted text-muted-foreground',
};

const ClientPanelPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const { data: cases = [], isLoading } = useCases();
  const deleteCase = useDeleteCase();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const filtered = cases.filter((c: any) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.caseNumber ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(isRtl ? `هل تريد حذف "${title}"؟` : `Delete "${title}"?`)) return;
    await deleteCase.mutateAsync(id);
    toast({ title: isRtl ? 'تم الحذف' : 'Deleted', description: title });
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-4xl font-heading">{t('cases')}</h1>
              <p className="text-muted-foreground text-sm mt-1">{user?.fullName}</p>
            </div>
            <Button className="gold-gradient text-navy font-semibold" onClick={() => navigate('/calculator')}>
              <Plus className="w-4 h-4 me-2" />{isRtl ? 'قضية جديدة' : 'New Case'}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'end-3' : 'start-3'} w-4 h-4 text-muted-foreground`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isRtl ? 'البحث في القضايا...' : 'Search cases...'}
              className={`w-full rounded-xl border border-border bg-card/60 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 ${isRtl ? 'pe-10 ps-4' : 'ps-10 pe-4'}`}
            />
          </div>

          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('cases')}</span>
                <Badge variant="outline">{filtered.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-accent" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {search ? (isRtl ? 'لا نتائج' : 'No results') : (isRtl ? 'لا توجد قضايا بعد' : 'No cases yet')}
                  </p>
                  {!search && (
                    <Button size="sm" className="gold-gradient text-navy mt-4" onClick={() => navigate('/calculator')}>
                      {isRtl ? 'ابدأ الآن' : 'Get started'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-accent/30 transition-all group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{c.title}</span>
                          <Badge variant="outline" className={`text-xs ${statusColor[c.status] ?? ''}`}>{c.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.caseNumber && `${c.caseNumber} · `}{new Date(c.created_at).toLocaleDateString()}
                          {c.deceased_name && ` · ${c.deceased_name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ms-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/case/${c.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate('/calculator')} title={isRtl ? 'إعادة حساب' : 'Recalculate'}>
                          <Calculator className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c.id, c.title)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientPanelPage;
