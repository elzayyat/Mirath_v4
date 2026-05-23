import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, LogIn, LogOut, Shield, Briefcase, UserRound,
  BarChart3, Calculator, Menu, User, Settings, Globe, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { applyLanguageDirection } from '@/i18n';
import { useNumbers } from '@/contexts/NumberContext';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { useArabicIndic, setUseArabicIndic } = useNumbers();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = location.pathname === '/';
  const isRtl = i18n.language === 'ar';

  const switchLanguage = async () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', next);
    localStorage.setItem('mirath_language', next);
    await i18n.changeLanguage(next);
    applyLanguageDirection(next);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const panelPath = user?.role === 'Admin' ? '/admin' : user?.role === 'Lawyer' ? '/lawyer' : '/client';

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'Admin':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 font-medium text-[10px] py-0 px-2">Admin</Badge>;
      case 'Lawyer':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 font-medium text-[10px] py-0 px-2">Lawyer</Badge>;
      case 'Client':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 font-medium text-[10px] py-0 px-2">Client</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground font-medium text-[10px] py-0 px-2">User</Badge>;
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) => {
    const base = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all";
    if (isActive(path)) {
      return `${base} text-accent bg-accent/5 font-semibold border-b-2 border-accent rounded-b-none`;
    }
    return isHome 
      ? `${base} text-white/80 hover:text-white hover:bg-white/10` 
      : `${base} text-muted-foreground hover:text-foreground hover:bg-muted/50`;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isHome 
        ? 'bg-navy/85 backdrop-blur-md border-b border-white/10 shadow-lg' 
        : 'bg-card/90 backdrop-blur-md border-b border-border shadow-sm'
    }`}>
      <div className="container mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 select-none group">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center font-bold text-navy shadow-md shadow-accent/25 group-hover:scale-105 transition-all">
            M
          </div>
          <div className="flex flex-col">
            <span className={`font-heading text-lg leading-none ${isHome ? 'text-white' : 'text-foreground'}`}>
              {t('brand') || 'Mirath'}
            </span>
            <span className="text-accent font-arabic text-xs tracking-wider leading-none mt-0.5">
              {t('brandAr') || 'ميراث'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-2">
          {user && (
            <>
              <Link to="/dashboard" className={linkClass('/dashboard')}>
                <LayoutDashboard className="w-4 h-4" />
                {t('dashboard')}
              </Link>
              <Link to={panelPath} className={linkClass(panelPath)}>
                {user.role === 'Admin' ? <Shield className="w-4 h-4" /> : user.role === 'Lawyer' ? <Briefcase className="w-4 h-4" /> : <UserRound className="w-4 h-4" />}
                {t(user.role === 'Admin' ? 'admin' : user.role === 'Lawyer' ? 'lawyer' : 'client')}
              </Link>
              <Link to="/reports" className={linkClass('/reports')}>
                <BarChart3 className="w-4 h-4" />
                {t('reports')}
              </Link>
            </>
          )}
          <Link to="/calculator">
            <Button size="sm" className="gold-gradient text-navy font-semibold hover:opacity-90 shadow-sm shadow-accent/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Calculator className="w-4 h-4 me-1.5" />
              {t('calculator')}
            </Button>
          </Link>
        </div>

        {/* Utilities & User Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          {user && (
            <div className={isHome ? 'text-white' : 'text-foreground'}>
              <NotificationBell />
            </div>
          )}

          {/* Language Toggle */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={switchLanguage}
            className={`w-9 h-9 rounded-lg ${isHome ? 'text-white hover:bg-white/10' : ''}`}
            title={isRtl ? 'English' : 'العربية'}
          >
            <Globe className="w-4 h-4" />
          </Button>

          {/* Numeral type switch for Arabic */}
          {isRtl && (
            <Button 
              size="sm" 
              variant={useArabicIndic ? 'default' : 'outline'} 
              onClick={() => setUseArabicIndic(!useArabicIndic)}
              className={`text-xs px-2 h-9 rounded-lg ${isHome && !useArabicIndic ? 'text-white border-white/20 hover:bg-white/10' : ''}`}
            >
              ٠١٢٣
            </Button>
          )}

          {/* User Profile Dropdown or Sign In */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-full border border-border hover:border-accent/40 bg-muted/20 hover:bg-muted/40 transition-all focus:outline-none">
                  <Avatar className="w-8 h-8 ring-2 ring-accent/20">
                    <AvatarFallback className="gold-gradient text-navy text-xs font-bold font-heading">
                      {getInitials(user.fullName || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`hidden lg:inline text-sm font-medium px-1 ${isHome ? 'text-white' : 'text-foreground'}`}>
                    {user.nameEnglish || user.fullName || user.email.split('@')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{user.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                  <User className="w-4 h-4 me-2" />
                  <span>{isRtl ? 'الملف الشخصي' : 'Profile'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(panelPath)} className="cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 me-2" />
                  <span>{isRtl ? 'لوحة التحكم' : 'Dashboard'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                  <Settings className="w-4 h-4 me-2" />
                  <span>{isRtl ? 'الإعدادات' : 'Settings'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                  <LogOut className="w-4 h-4 me-2" />
                  <span>{t('signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="ghost" className={`flex items-center gap-1 h-9 rounded-lg ${isHome ? 'text-white hover:bg-white/10' : ''}`}>
                <LogIn className="w-4 h-4 me-1" />
                {t('signIn')}
              </Button>
            </Link>
          )}

          {/* Mobile hamburger menu */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={`w-9 h-9 rounded-lg ${isHome ? 'text-white hover:bg-white/10' : ''}`}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRtl ? 'left' : 'right'} className="w-[80vw] sm:max-w-sm p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Brand */}
                  <div className="flex items-center gap-2 select-none border-b border-border pb-4">
                    <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center font-bold text-navy">
                      M
                    </div>
                    <div className="flex flex-col">
                      <span className="font-heading text-base font-bold text-foreground">
                        {t('brand') || 'Mirath'}
                      </span>
                      <span className="text-accent font-arabic text-xs tracking-wider leading-none mt-0.5">
                        {t('brandAr') || 'ميراث'}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex flex-col gap-2">
                    {user && (
                      <>
                        <Link 
                          to="/dashboard" 
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-accent/10 text-accent font-bold' : 'hover:bg-muted text-muted-foreground'}`}
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          <span>{t('dashboard')}</span>
                        </Link>
                        <Link 
                          to={panelPath} 
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive(panelPath) ? 'bg-accent/10 text-accent font-bold' : 'hover:bg-muted text-muted-foreground'}`}
                        >
                          {user.role === 'Admin' ? <Shield className="w-5 h-5" /> : user.role === 'Lawyer' ? <Briefcase className="w-5 h-5" /> : <UserRound className="w-5 h-5" />}
                          <span>{t(user.role === 'Admin' ? 'admin' : user.role === 'Lawyer' ? 'lawyer' : 'client')}</span>
                        </Link>
                        <Link 
                          to="/reports" 
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive('/reports') ? 'bg-accent/10 text-accent font-bold' : 'hover:bg-muted text-muted-foreground'}`}
                        >
                          <BarChart3 className="w-5 h-5" />
                          <span>{t('reports')}</span>
                        </Link>
                      </>
                    )}
                    <Link 
                      to="/calculator" 
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive('/calculator') ? 'bg-accent/10 text-accent font-bold' : 'hover:bg-muted text-muted-foreground'}`}
                    >
                      <Calculator className="w-5 h-5" />
                      <span>{t('calculator')}</span>
                    </Link>
                  </div>
                </div>

                {/* Footer/Logout in drawer */}
                {user && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-10 h-10 ring-2 ring-accent/20">
                        <AvatarFallback className="gold-gradient text-navy text-sm font-bold">
                          {getInitials(user.fullName || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => { setMobileOpen(false); handleSignOut(); }} 
                      variant="destructive" 
                      className="w-full justify-center"
                    >
                      <LogOut className="w-4 h-4 me-2" />
                      {t('signOut')}
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
