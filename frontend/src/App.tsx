import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import { NumberProvider } from '@/contexts/NumberContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const Index = lazy(() => import('@/pages/Index'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const CalculatorPage = lazy(() => import('@/pages/CalculatorPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const CaseDetailPage = lazy(() => import('@/pages/CaseDetailPage'));
const CaseManagementPage = lazy(() => import('@/pages/CaseManagementPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const AdminPanelPage = lazy(() => import('@/pages/AdminPanelPage'));
const LawyerPanelPage = lazy(() => import('@/pages/LawyerPanelPage'));
const ClientPanelPage = lazy(() => import('@/pages/ClientPanelPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const queryClient = new QueryClient();
const RouteLoader = () => <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>;
function App() { return <QueryClientProvider client={queryClient}><AuthProvider><NumberProvider><BrowserRouter><Suspense fallback={<RouteLoader />}><Routes><Route path="/" element={<Index />} /><Route path="/auth" element={<AuthPage />} /><Route path="/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} /><Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} /><Route path="/admin" element={<ProtectedRoute roles={["Admin"]}><AdminPanelPage /></ProtectedRoute>} /><Route path="/lawyer" element={<ProtectedRoute roles={["Lawyer", "Admin"]}><LawyerPanelPage /></ProtectedRoute>} /><Route path="/client" element={<ProtectedRoute><ClientPanelPage /></ProtectedRoute>} /><Route path="/case/:id" element={<ProtectedRoute><CaseDetailPage /></ProtectedRoute>} /><Route path="/case/:id/manage" element={<ProtectedRoute roles={["Lawyer", "Admin"]}><CaseManagementPage /></ProtectedRoute>} /><Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} /><Route path="*" element={<NotFound />} /></Routes></Suspense><Toaster /></BrowserRouter></NumberProvider></AuthProvider></QueryClientProvider>; }
export default App;
