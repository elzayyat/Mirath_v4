import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useAllCases } from '@/hooks/useCases';
import { mockStore, downloadCsv, type MockUser, type MockLog } from '@/lib/mockStore';
import { useToast } from '@/hooks/use-toast';
import { useNumbers } from '@/contexts/NumberContext';
import {
  Shield, Users, Briefcase, Calculator, Activity, Trash2, UserCheck,
  UserX, Eye, Search, RefreshCw, Download, AlertTriangle, Info,
  CheckSquare, Square, Server, ChevronRight, ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

type Tab = 'overview' | 'users' | 'cases' | 'logs';

const levelIcon = { info: Info, warning: AlertTriangle, error: AlertTriangle };
const levelColor = {
  info: 'border-blue-500/20 bg-blue-500/5',
  warning: 'border-amber-500/20 bg-amber-500/5',
  error: 'border-red-500/20 bg-red-500/10',
};
const levelText = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
};
const roleColor: Record<MockUser['role'], string> = {
  Admin: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  Lawyer: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  Client: 'bg-green-500/15 text-green-700 border-green-500/30',
  EndUser: 'bg-muted text-muted-foreground',
};
const ROLE_CHART_COLORS: Record<MockUser['role'], string> = {
  Admin: '#c9a84c',
  Lawyer: '#1e4d8c',
  Client: '#2d8a5a',
  EndUser: '#94a3b8',
};

export default function AdminPanelPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatNumber } = useNumbers();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const [tab, setTab] = useState<Tab>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logLevel, setLogLevel] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [tick, setTick] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [caseStatusFilter, setCaseStatusFilter] = useState('all');
  const [caseMadhabFilter, setCaseMadhabFilter] = useState('all');
  const [caseDateFrom, setCaseDateFrom] = useState('');
  const [caseDateTo, setCaseDateTo] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = () => setTick(t => t + 1);

  // Auto-refresh logs every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(refresh, 30000);
    } else {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [autoRefresh]);

  const { data: allCases = [] } = useAllCases();
  const allUsers = mockStore.getAllUsers() as MockUser[];
  const allLogs = mockStore.getLogs() as MockLog[];

  if (!user || user.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="pt-24 text-center px-4 py-20">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{isRtl ? 'غير مصرح لك بالوصول' : 'Access denied. Admin only.'}</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/dashboard')}>{isRtl ? 'العودة' : 'Go to Dashboard'}</Button>
        </div>
      </div>
    );
  }

  // System health
  const lsKeys = Object.keys(localStorage).length;
  let lsSize = 0;
  try {
    for (const k of Object.keys(localStorage)) {
      lsSize += (localStorage.getItem(k)?.length ?? 0);
    }
  } catch { /* ignore */ }
  const lastLog = allLogs[0];

  // Stats cards
  const activeUsers = allUsers.filter(u => u.isActive).length;
  const calculatedCases = allCases.filter(c => c.status === 'Calculated' || c.status === 'Completed').length;
  const totalEstate = allCases.reduce((s, c) => s + (c.total_estate ?? 0), 0);

  const stats = [
    { label: isRtl ? 'المستخدمون' : 'Total Users', value: allUsers.length, icon: Users, color: 'text-blue-500' },
    { label: isRtl ? 'النشطون' : 'Active Users', value: activeUsers, icon: UserCheck, color: 'text-green-500' },
    { label: isRtl ? 'القضايا' : 'Total Cases', value: allCases.length, icon: Briefcase, color: 'text-accent' },
    { label: isRtl ? 'محسوبة' : 'Calculated', value: calculatedCases, icon: Calculator, color: 'text-amber-500' },
    { label: isRtl ? 'إجمالي التركات' : 'Estate Managed', value: formatNumber(totalEstate), icon: Briefcase, color: 'text-purple-500', isString: true },
    { label: isRtl ? 'السجلات' : 'Log Entries', value: allLogs.length, icon: Activity, color: 'text-rose-500' },
  ];

  // Role chart data
  const roleChartData = (['Admin','Lawyer','Client','EndUser'] as MockUser['role'][]).map(r => ({
    name: r,
    count: allUsers.filter(u => u.role === r).length,
    fill: ROLE_CHART_COLORS[r],
  }));

  // User actions
  const handleSetActive = (u: MockUser, active: boolean) => {
    if (u.id === user.id) { toast({ title: isRtl ? 'لا يمكن تعطيل حسابك' : 'Cannot deactivate your own account', variant: 'destructive' }); return; }
    mockStore.setUserActive(u.id, active, user.email);
    toast({ title: active ? (isRtl ? 'تم التفعيل' : 'Activated') : (isRtl ? 'تم التعطيل' : 'Deactivated'), description: u.email });
    refresh();
  };

  const handleChangeRole = (u: MockUser, role: MockUser['role']) => {
    if (u.id === user.id) { toast({ title: isRtl ? 'لا يمكن تغيير دورك بنفسك' : 'Cannot change your own role', variant: 'destructive' }); return; }
    mockStore.updateUserRole(u.id, role);
    toast({ title: isRtl ? 'تم تغيير الدور' : 'Role updated', description: `${u.email} → ${role}` });
    mockStore.addLog(user.id, user.email, 'CHANGE_ROLE', `Changed ${u.email} role to ${role}`, 'warning');
    refresh();
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.length === 0) return;
    const filtered = selectedUsers.filter(id => id !== user.id);
    if (filtered.length === 0) { toast({ title: isRtl ? 'لا يمكن تعطيل حسابك' : 'Cannot deactivate yourself', variant: 'destructive' }); return; }
    mockStore.bulkSetUserActive(filtered, false, user.email);
    toast({ title: isRtl ? `تم تعطيل ${filtered.length} مستخدمين` : `Deactivated ${filtered.length} users` });
    setSelectedUsers([]);
    refresh();
  };

  const handleClearLogs = () => {
    if (!confirm(isRtl ? 'هل تريد مسح جميع السجلات؟' : 'Clear all logs?')) return;
    mockStore.clearLogs();
    toast({ title: isRtl ? 'تم مسح السجلات' : 'Logs cleared' });
    refresh();
  };

  // Filtered data
  const filteredUsers = allUsers.filter(u =>
    !userSearch || u.email.includes(userSearch) || u.fullName.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCases = allCases.filter(c => {
    const matchStatus = caseStatusFilter === 'all' || c.status === caseStatusFilter;
    const matchMadhab = caseMadhabFilter === 'all' || c.madhab === caseMadhabFilter;
    const matchFrom = !caseDateFrom || new Date(c.created_at) >= new Date(caseDateFrom);
    const matchTo = !caseDateTo || new Date(c.created_at) <= new Date(caseDateTo + 'T23:59:59');
    return matchStatus && matchMadhab && matchFrom && matchTo;
  });

  const filteredLogs = allLogs.filter(l => {
    const matchLevel = logLevel === 'all' || l.level === logLevel;
    const matchSearch = !logSearch || l.action.includes(logSearch.toUpperCase()) || l.userEmail.includes(logSearch) || l.details.toLowerCase().includes(logSearch.toLowerCase());
    return matchLevel && matchSearch;
  });

  const tabs: { id: Tab; label: string; labelAr: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة', icon: Activity },
    { id: 'users', label: 'Users', labelAr: 'المستخدمون', icon: Users },
    { id: 'cases', label: 'Cases', labelAr: 'القضايا', icon: Briefcase },
    { id: 'logs', label: 'Logs', labelAr: 'السجلات', icon: Activity, badge: allLogs.length },
  ];

  const inputCls = `w-full rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40`;
  const selectCls = `rounded-xl border border-border bg-card/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40`;

  const casesPerUser = (uid: string) => allCases.filter(c => c.userId === uid).length;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-accent" />
                <h1 className="text-4xl font-heading">{isRtl ? 'لوحة الإدارة' : 'Admin Panel'}</h1>
              </div>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="w-4 h-4 me-1" />{isRtl ? 'تحديث' : 'Refresh'}</Button>
              <Badge className="gold-gradient text-navy px-3 py-1">Admin</Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map(s => (
              <Card key={s.label} className="luxury-card">
                <CardContent className="p-4">
                  <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-2xl font-heading">{s.isString ? s.value : formatNumber(s.value as number)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit overflow-x-auto">
            {tabs.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === tb.id ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                }`}>
                <tb.icon className="w-4 h-4" />{isRtl ? tb.labelAr : tb.label}
                {tb.badge !== undefined && tb.badge > 0 && (
                  <span className="bg-accent/20 text-accent text-xs px-1.5 py-0.5 rounded-full">{tb.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent logs */}
                <Card className="luxury-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{isRtl ? 'آخر الأنشطة' : 'Recent Activity'}</CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setTab('logs')} className="text-accent text-xs">
                      {isRtl ? 'عرض الكل' : 'View all'}<ChevronRight className="w-3 h-3 ms-1" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {allLogs.slice(0, 10).map(l => {
                      const Icon = levelIcon[l.level] ?? Info;
                      return (
                        <div key={l.id} className={`flex items-start gap-2 p-2 rounded-lg border ${levelColor[l.level]}`}>
                          <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${levelText[l.level]}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{l.action}</p>
                            <p className="text-xs text-muted-foreground truncate">{l.userEmail} · {new Date(l.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    {allLogs.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">{isRtl ? 'لا سجلات بعد' : 'No logs yet'}</p>}
                  </CardContent>
                </Card>

                {/* Users by Role — bar chart */}
                <Card className="luxury-card">
                  <CardHeader><CardTitle className="text-base">{isRtl ? 'المستخدمون حسب الدور' : 'Users by Role'}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer>
                        <BarChart data={roleChartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                            {roleChartData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Health */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Server className="w-4 h-4 text-accent" />{isRtl ? 'صحة النظام' : 'System Health'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'مفاتيح التخزين' : 'Storage Keys'}</p>
                      <p className="font-heading text-lg">{lsKeys}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'حجم البيانات' : 'Data Size'}</p>
                      <p className="font-heading text-lg">{(lsSize / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'إصدار التطبيق' : 'App Version'}</p>
                      <p className="font-heading text-lg">1.0.0</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">{isRtl ? 'آخر نشاط' : 'Last Activity'}</p>
                      <p className="font-heading text-sm">{lastLog ? new Date(lastLog.timestamp).toLocaleTimeString() : '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <Card className="luxury-card">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <CardTitle>{isRtl ? 'إدارة المستخدمين' : 'User Management'}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {selectedUsers.length > 0 && (
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={handleBulkDeactivate}>
                      <UserX className="w-3.5 h-3.5 me-1" />
                      {isRtl ? `تعطيل (${selectedUsers.length})` : `Deactivate (${selectedUsers.length})`}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { downloadCsv(mockStore.exportUsersCSV(), 'mirath-users.csv'); toast({ title: isRtl ? 'تم تصدير المستخدمين' : 'Users exported' }); }}>
                    <Download className="w-3.5 h-3.5 me-1" />{isRtl ? 'تصدير CSV' : 'Export CSV'}
                  </Button>
                  <Badge variant="outline">{filteredUsers.length} / {allUsers.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'end-3' : 'start-3'} w-4 h-4 text-muted-foreground`} />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder={isRtl ? 'البحث بالاسم أو البريد...' : 'Search by name or email...'}
                    className={`${inputCls} ${isRtl ? 'pe-10 ps-4' : 'ps-10 pe-4'}`} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 px-2 w-8">
                          <button onClick={() => setSelectedUsers(selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id))}>
                            {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0
                              ? <CheckSquare className="w-4 h-4 text-accent" />
                              : <Square className="w-4 h-4 text-muted-foreground" />}
                          </button>
                        </th>
                        <th className="text-start py-2 px-2">{t('name')}</th>
                        <th className="text-start py-2 px-2">{t('email')}</th>
                        <th className="text-start py-2 px-2">{t('role')}</th>
                        <th className="text-start py-2 px-2">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th className="text-start py-2 px-2 hidden md:table-cell">{isRtl ? 'القضايا' : 'Cases'}</th>
                        <th className="text-start py-2 px-2 hidden lg:table-cell">{isRtl ? 'تاريخ الإنشاء' : 'Created'}</th>
                        <th className="text-start py-2 px-2">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-2">
                            <button onClick={() => setSelectedUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])}>
                              {selectedUsers.includes(u.id)
                                ? <CheckSquare className="w-4 h-4 text-accent" />
                                : <Square className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{u.nameEnglish || u.fullName}</p>
                              {u.nameArabic && <p className="text-xs text-muted-foreground font-arabic">{u.nameArabic}</p>}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground text-xs">{u.email}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${roleColor[u.role]}`}>{u.role}</Badge>
                              {u.id !== user.id && (
                                <select
                                  value={u.role}
                                  onChange={e => handleChangeRole(u, e.target.value as MockUser['role'])}
                                  className="rounded-lg border border-border bg-background text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent/40 ms-1">
                                  {(['Admin','Lawyer','Client','EndUser'] as MockUser['role'][]).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className={`text-xs ${u.isActive ? 'text-green-600 border-green-500/30' : 'text-destructive border-destructive/30'}`}>
                              {u.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 hidden md:table-cell">
                            <span className="text-xs font-medium">{casesPerUser(u.id)}</span>
                          </td>
                          <td className="py-3 px-2 hidden lg:table-cell text-xs text-muted-foreground">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-2">
                            {u.id !== user.id && (
                              <Button size="sm" variant="outline"
                                className={u.isActive ? 'text-destructive border-destructive/30 hover:bg-destructive/5' : 'text-green-600 border-green-500/30 hover:bg-green-500/5'}
                                onClick={() => handleSetActive(u, !u.isActive)}>
                                {u.isActive ? <UserX className="w-3.5 h-3.5 me-1" /> : <UserCheck className="w-3.5 h-3.5 me-1" />}
                                {u.isActive ? (isRtl ? 'تعطيل' : 'Deactivate') : (isRtl ? 'تفعيل' : 'Activate')}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">{isRtl ? 'لا مستخدمين' : 'No users found'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── CASES ── */}
          {tab === 'cases' && (
            <Card className="luxury-card">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <CardTitle>{isRtl ? 'جميع القضايا' : 'All Cases'}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { downloadCsv(mockStore.exportCasesCSV(), 'mirath-cases.csv'); toast({ title: isRtl ? 'تم تصدير القضايا' : 'Cases exported' }); }}>
                  <Download className="w-3.5 h-3.5 me-1" />{isRtl ? 'تصدير CSV' : 'Export CSV'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <select value={caseStatusFilter} onChange={e => setCaseStatusFilter(e.target.value)} className={selectCls}>
                    <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
                    {['Draft','Calculated','Completed','Archived'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={caseMadhabFilter} onChange={e => setCaseMadhabFilter(e.target.value)} className={selectCls}>
                    <option value="all">{isRtl ? 'كل المذاهب' : 'All Madhabs'}</option>
                    {['hanafi','maliki','shafii','hanbali','jumhur'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <label>{isRtl ? 'من' : 'From'}</label>
                    <input type="date" value={caseDateFrom} onChange={e => setCaseDateFrom(e.target.value)}
                      className="rounded-xl border border-border bg-card/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40" />
                    <label>{isRtl ? 'إلى' : 'To'}</label>
                    <input type="date" value={caseDateTo} onChange={e => setCaseDateTo(e.target.value)}
                      className="rounded-xl border border-border bg-card/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40" />
                  </div>
                  <Badge variant="outline">{filteredCases.length} {isRtl ? 'قضية' : 'cases'}</Badge>
                </div>

                {filteredCases.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">{isRtl ? 'لا توجد قضايا' : 'No cases found'}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="text-start py-2 px-2">{isRtl ? 'الرقم' : 'Case #'}</th>
                          <th className="text-start py-2 px-2">{t('title')}</th>
                          <th className="text-start py-2 px-2">{isRtl ? 'المتوفى' : 'Deceased'}</th>
                          <th className="text-start py-2 px-2">{isRtl ? 'التركة' : 'Estate'}</th>
                          <th className="text-start py-2 px-2">{isRtl ? 'المذهب' : 'Madhab'}</th>
                          <th className="text-start py-2 px-2">{isRtl ? 'الحالة' : 'Status'}</th>
                          <th className="text-start py-2 px-2">{isRtl ? 'التاريخ' : 'Date'}</th>
                          <th className="py-2 px-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCases.map(c => (
                          <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-2 text-xs text-muted-foreground font-mono">{c.caseNumber}</td>
                            <td className="py-3 px-2 font-medium max-w-[180px] truncate">{c.title}</td>
                            <td className="py-3 px-2 text-muted-foreground text-xs">{c.deceased_name || '—'}</td>
                            <td className="py-3 px-2 font-mono text-xs">{c.total_estate ? formatNumber(c.total_estate) : '—'}</td>
                            <td className="py-3 px-2 capitalize text-xs text-muted-foreground">{c.madhab || '—'}</td>
                            <td className="py-3 px-2">
                              <Badge variant="outline" className={`text-xs ${c.status === 'Calculated' ? 'text-accent border-accent/30' : ''}`}>{c.status}</Badge>
                            </td>
                            <td className="py-3 px-2 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-2">
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/case/${c.id}`)}>
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
          )}

          {/* ── LOGS ── */}
          {tab === 'logs' && (
            <Card className="luxury-card">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  {isRtl ? 'سجل الأنشطة' : 'Activity Logs'}
                  <Badge variant="outline" className="text-xs">{filteredLogs.length}</Badge>
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {/* Auto-refresh toggle */}
                  <Button size="sm" variant="outline"
                    onClick={() => setAutoRefresh(v => !v)}
                    className={autoRefresh ? 'border-accent text-accent' : ''}>
                    {autoRefresh
                      ? <><ToggleRight className="w-4 h-4 me-1 text-accent" />{isRtl ? 'تحديث تلقائي: تشغيل' : 'Auto: ON'}</>
                      : <><ToggleLeft className="w-4 h-4 me-1" />{isRtl ? 'تحديث تلقائي' : 'Auto-Refresh'}</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={refresh}><RefreshCw className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => { downloadCsv(mockStore.exportLogsCSV(), 'mirath-logs.csv'); toast({ title: isRtl ? 'تم تصدير السجلات' : 'Logs exported' }); }}>
                    <Download className="w-3.5 h-3.5 me-1" />{isRtl ? 'تصدير' : 'Export CSV'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={handleClearLogs}>
                    <Trash2 className="w-3.5 h-3.5 me-1" />{isRtl ? 'مسح الكل' : 'Clear'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-3 flex-wrap">
                  <div className={`relative flex-1 min-w-[180px]`}>
                    <Search className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'end-3' : 'start-3'} w-4 h-4 text-muted-foreground`} />
                    <input value={logSearch} onChange={e => setLogSearch(e.target.value)}
                      placeholder={isRtl ? 'البحث في السجلات...' : 'Search logs...'}
                      className={`${inputCls} ${isRtl ? 'pe-10 ps-4' : 'ps-10 pe-4'}`} />
                  </div>
                  <div className="flex gap-1">
                    {(['all','info','warning','error'] as const).map(lv => (
                      <button key={lv} onClick={() => setLogLevel(lv)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${logLevel === lv ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-accent/40'}`}>
                        {lv === 'all' ? (isRtl ? 'الكل' : 'All') : lv}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Log table */}
                <div className="space-y-1 max-h-[550px] overflow-y-auto">
                  {filteredLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">{isRtl ? 'لا سجلات' : 'No logs found'}</p>
                  ) : (
                    filteredLogs.map(l => {
                      const Icon = levelIcon[l.level] ?? Info;
                      return (
                        <div key={l.id} className={`flex items-start gap-3 p-3 rounded-lg border ${levelColor[l.level]}`}>
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${levelText[l.level]}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold">{l.action}</span>
                              <span className="text-xs opacity-60">{l.userEmail}</span>
                              {l.ip && <span className="text-xs opacity-40 font-mono">{l.ip}</span>}
                              <span className="text-xs opacity-40 ms-auto">{new Date(l.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-xs opacity-70 mt-0.5">{l.details}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
