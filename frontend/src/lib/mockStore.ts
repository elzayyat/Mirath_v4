// Mock store — full localStorage persistence for standalone mode

export interface MockUser {
  id: string;
  email: string;
  nameEnglish: string;
  nameArabic: string;
  fullName: string;
  phone: string;
  role: 'Admin' | 'Lawyer' | 'Client' | 'EndUser';
  isActive: boolean;
  createdAt: string;
  subscription?: {
    planName: string;
    casesUsedThisPeriod: number;
    monthlyCaseLimit: number;
    hasAdvancedCalculator: boolean;
    hasPdfExports: boolean;
    hasClientManagement: boolean;
    hasAdminAccess: boolean;
    usagePeriodEnd: string;
  };
}

export interface MockCase {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  decedent?: { name: string; deathDate: string; religion: string; maritalStatus: string; };
  heirs: MockHeir[];
  assets: MockAsset[];
  lastResult?: unknown;
  madhab?: string;
  deceased_name?: string;
  deceased_gender?: string;
  total_estate?: number;
  debts?: number;
  funeral_expenses?: number;
  bequests?: number;
}

export interface MockHeir {
  id: string;
  caseId: string;
  name: string;
  relationship: string;
  gender: string;
  isAlive: boolean;
  hasChildren: boolean;
  count: number;
}

export interface MockAsset {
  id: string;
  caseId: string;
  type: string;
  description: string;
  value: number;
  currency: string;
  weight?: number;
  unit?: string;
  quantity?: number;
}

export interface MockLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  ip: string;
  level: 'info' | 'warning' | 'error';
}

export interface MockStats {
  totalCases: number;
  calculatedCases: number;
  draftCases: number;
  totalHeirsCalculated: number;
  totalEstateManaged: number;
  casesByMadhab: Record<string, number>;
  casesByStatus: Record<string, number>;
  recentCases: MockCase[];
  thisMonthCases: number;
  lastMonthCases: number;
}

const KEYS = {
  users: 'mirath_mock_users',
  cases: 'mirath_mock_cases',
  logs: 'mirath_mock_logs',
  currentUser: 'mirath_mock_current_user',
  accessToken: 'mirath_access_token',
  seeded: 'mirath_seeded_v3',
};

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}
function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}
function logAction(userId: string, email: string, action: string, details: string, level: MockLog['level'] = 'info'): void {
  const logs = read<MockLog>(KEYS.logs);
  logs.unshift({
    id: uid(),
    timestamp: new Date().toISOString(),
    userId,
    userEmail: email,
    action,
    details,
    ip: '127.0.0.1',
    level,
  });
  // Keep last 500 logs
  write(KEYS.logs, logs.slice(0, 500));
}

// ── Seed admin account on first load ──────────────────────────────────────────
function seedAdmin(): void {
  if (localStorage.getItem(KEYS.seeded)) return;
  const users = read<MockUser & { _pw: string }>(KEYS.users);
  const adminEmail = 'admin@mirath.app';
  if (!users.find(u => u.email === adminEmail)) {
    const admin: MockUser & { _pw: string } = {
      id: 'admin-seed-001',
      email: adminEmail,
      nameEnglish: 'System Admin',
      nameArabic: 'مدير النظام',
      fullName: 'System Admin',
      phone: '+20 100 000 0000',
      role: 'Admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      _pw: 'Mirath@Admin2026!',
      subscription: {
        planName: 'Admin Unlimited',
        casesUsedThisPeriod: 0,
        monthlyCaseLimit: 9999,
        hasAdvancedCalculator: true,
        hasPdfExports: true,
        hasClientManagement: true,
        hasAdminAccess: true,
        usagePeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
    users.push(admin);
    write(KEYS.users, users);
    logAction('admin-seed-001', adminEmail, 'SYSTEM_SEED', 'Admin account seeded on first run', 'info');
  }
  localStorage.setItem(KEYS.seeded, '1');
}

// Run seed immediately
seedAdmin();

// ── CSV helpers ─────────────────────────────────────────────────────────────
function escapeCsv(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
function rowsToCsv(headers: string[], rows: string[][]): string {
  return [headers.map(escapeCsv).join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n');
}

export const mockStore = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  register(email: string, password: string, nameEnglish: string, nameArabic: string, phone: string, role: MockUser['role']): MockUser {
    // Prevent registering as Admin via UI — only seed admin exists
    if (role === 'Admin') role = 'Client';
    const users = read<MockUser & { _pw: string }>(KEYS.users);
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered.');
    }
    const user: MockUser & { _pw: string } = {
      id: uid(),
      email: email.toLowerCase(),
      nameEnglish: nameEnglish || email.split('@')[0],
      nameArabic: nameArabic || '',
      fullName: nameEnglish || email.split('@')[0],
      phone: phone || '',
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      _pw: password,
      subscription: {
        planName: role === 'Lawyer' ? 'Lawyer Pro' : 'Standard',
        casesUsedThisPeriod: 0,
        monthlyCaseLimit: role === 'Lawyer' ? 50 : 10,
        hasAdvancedCalculator: true,
        hasPdfExports: role === 'Lawyer',
        hasClientManagement: role === 'Lawyer',
        hasAdminAccess: false,
        usagePeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
    users.push(user);
    write(KEYS.users, users);
    logAction(user.id, email, 'REGISTER', `New ${role} account registered`, 'info');
    return user;
  },

  login(email: string, password: string): MockUser {
    // Ensure admin exists
    seedAdmin();
    const users = read<MockUser & { _pw: string }>(KEYS.users);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('Invalid email or password.');
    if (user._pw !== password) throw new Error('Invalid email or password.');
    if (!user.isActive) throw new Error('Account is inactive. Contact admin.');
    logAction(user.id, email, 'LOGIN', `Login from ${navigator.userAgent.slice(0,50)}`, 'info');
    return user;
  },

  getUser(id: string): MockUser | undefined {
    return read<MockUser>(KEYS.users).find(u => u.id === id);
  },

  getAllUsers(): (MockUser & { _pw?: string })[] {
    return read<MockUser & { _pw: string }>(KEYS.users).map(u => { const { _pw, ...safe } = u; return safe; });
  },

  updateUserRole(id: string, role: MockUser['role']): void {
    const users = read<MockUser & { _pw: string }>(KEYS.users);
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) { users[idx].role = role; write(KEYS.users, users); }
  },

  setUserActive(id: string, isActive: boolean, adminEmail: string): void {
    const users = read<MockUser & { _pw: string }>(KEYS.users);
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) {
      users[idx].isActive = isActive;
      write(KEYS.users, users);
      logAction(id, users[idx].email, isActive ? 'ACTIVATE' : 'DEACTIVATE', `By admin ${adminEmail}`, 'warning');
    }
  },

  bulkSetUserActive(ids: string[], isActive: boolean, adminEmail: string): void {
    const users = read<MockUser & { _pw: string }>(KEYS.users);
    ids.forEach(id => {
      const idx = users.findIndex(u => u.id === id);
      if (idx >= 0) {
        users[idx].isActive = isActive;
        logAction(id, users[idx].email, isActive ? 'ACTIVATE' : 'DEACTIVATE', `Bulk action by admin ${adminEmail}`, 'warning');
      }
    });
    write(KEYS.users, users);
  },

  persistCurrentUser(user: MockUser): void {
    localStorage.setItem(KEYS.currentUser, JSON.stringify(user));
    localStorage.setItem(KEYS.accessToken, `mock_token_${user.id}`);
  },

  getCurrentUser(): MockUser | null {
    try {
      const raw = localStorage.getItem(KEYS.currentUser);
      if (!raw) return null;
      const u = JSON.parse(raw) as MockUser;
      // Refresh from users store (in case role/status changed)
      const fresh = read<MockUser>(KEYS.users).find(x => x.id === u.id);
      return fresh ?? u;
    } catch { return null; }
  },

  clearCurrentUser(): void {
    const u = mockStore.getCurrentUser();
    if (u) logAction(u.id, u.email, 'LOGOUT', 'User logged out', 'info');
    localStorage.removeItem(KEYS.currentUser);
    localStorage.removeItem(KEYS.accessToken);
    localStorage.removeItem('mirath_refresh_token');
    localStorage.removeItem('mirath_access_token_expires_at');
  },

  // ── Cases ─────────────────────────────────────────────────────────────────
  createCase(userId: string, title: string, data?: Partial<MockCase>): MockCase {
    const cases = read<MockCase>(KEYS.cases);
    const c: MockCase = {
      id: uid(),
      caseNumber: `MIR-${Date.now().toString().slice(-6)}`,
      title,
      status: 'Draft',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId,
      heirs: [],
      assets: [],
      ...data,
    };
    cases.push(c);
    write(KEYS.cases, cases);
    const u = mockStore.getUser(userId);
    if (u) logAction(userId, u.email, 'CREATE_CASE', `Case: ${title}`, 'info');
    return c;
  },

  getCases(userId: string): MockCase[] {
    return read<MockCase>(KEYS.cases).filter(c => c.userId === userId);
  },

  getAllCases(): MockCase[] {
    return read<MockCase>(KEYS.cases);
  },

  getCase(id: string): MockCase | undefined {
    return read<MockCase>(KEYS.cases).find(c => c.id === id);
  },

  updateCase(id: string, updates: Partial<MockCase>): MockCase {
    const cases = read<MockCase>(KEYS.cases);
    const idx = cases.findIndex(c => c.id === id);
    if (idx < 0) throw new Error('Case not found');
    cases[idx] = { ...cases[idx], ...updates, updatedAt: new Date().toISOString() };
    write(KEYS.cases, cases);
    return cases[idx];
  },

  saveResult(caseId: string, result: unknown, deceased: { name: string; gender: string; totalEstate: number; debts: number; funeralExpenses: number; bequests: number }, heirs: { id: string; name: string; type: string; count: number }[], madhab: string, assets?: MockAsset[]): void {
    const cases = read<MockCase>(KEYS.cases);
    const idx = cases.findIndex(c => c.id === caseId);
    if (idx < 0) return;
    cases[idx].lastResult = result;
    cases[idx].status = 'Calculated';
    cases[idx].updatedAt = new Date().toISOString();
    cases[idx].deceased_name = deceased.name;
    cases[idx].deceased_gender = deceased.gender;
    cases[idx].total_estate = deceased.totalEstate;
    cases[idx].debts = deceased.debts;
    cases[idx].funeral_expenses = deceased.funeralExpenses;
    cases[idx].bequests = deceased.bequests;
    cases[idx].madhab = madhab;
    cases[idx].heirs = heirs.map(h => ({
      id: h.id,
      caseId,
      name: h.name,
      relationship: h.type,
      gender: 'male',
      isAlive: true,
      hasChildren: false,
      count: h.count,
    }));
    if (assets) {
      cases[idx].assets = assets.map(a => ({ ...a, caseId }));
    }
    write(KEYS.cases, cases);
    const c = cases[idx];
    const u = mockStore.getUser(c.userId);
    const resultObj = result as { distributableEstate?: number } | null;
    if (u) logAction(c.userId, u.email, 'CALCULATE', `Case ${c.caseNumber} calculated. Net: ${resultObj?.distributableEstate ?? 0}`, 'info');
  },

  deleteCase(id: string): void {
    const c = mockStore.getCase(id);
    const cases = read<MockCase>(KEYS.cases).filter(c => c.id !== id);
    write(KEYS.cases, cases);
    if (c) {
      const u = mockStore.getUser(c.userId);
      if (u) logAction(c.userId, u.email, 'DELETE_CASE', `Deleted case ${c.caseNumber}`, 'warning');
    }
  },

  // ── Logs ──────────────────────────────────────────────────────────────────
  getLogs(): MockLog[] {
    return read<MockLog>(KEYS.logs);
  },

  addLog(userId: string, email: string, action: string, details: string, level: MockLog['level'] = 'info'): void {
    logAction(userId, email, action, details, level);
  },

  clearLogs(): void {
    write(KEYS.logs, []);
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  getStats(userId?: string): MockStats {
    const allCases = userId
      ? read<MockCase>(KEYS.cases).filter(c => c.userId === userId)
      : read<MockCase>(KEYS.cases);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const calculatedCases = allCases.filter(c => c.status === 'Calculated' || c.status === 'Completed').length;
    const draftCases = allCases.filter(c => c.status === 'Draft').length;
    const totalHeirsCalculated = allCases.reduce((s, c) => s + (c.heirs?.length ?? 0), 0);
    const totalEstateManaged = allCases.reduce((s, c) => s + (c.total_estate ?? 0), 0);

    const casesByMadhab: Record<string, number> = {};
    const casesByStatus: Record<string, number> = {};
    for (const c of allCases) {
      const m = c.madhab ?? 'unknown';
      casesByMadhab[m] = (casesByMadhab[m] ?? 0) + 1;
      casesByStatus[c.status] = (casesByStatus[c.status] ?? 0) + 1;
    }

    const recentCases = [...allCases]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const thisMonthCases = allCases.filter(c => new Date(c.createdAt) >= thisMonthStart).length;
    const lastMonthCases = allCases.filter(c => {
      const d = new Date(c.createdAt);
      return d >= lastMonthStart && d <= lastMonthEnd;
    }).length;

    return {
      totalCases: allCases.length,
      calculatedCases,
      draftCases,
      totalHeirsCalculated,
      totalEstateManaged,
      casesByMadhab,
      casesByStatus,
      recentCases,
      thisMonthCases,
      lastMonthCases,
    };
  },

  // ── CSV Exports ───────────────────────────────────────────────────────────
  exportUsersCSV(): string {
    const users = mockStore.getAllUsers();
    const headers = ['ID', 'Email', 'Name (English)', 'Name (Arabic)', 'Phone', 'Role', 'Status', 'Created At', 'Plan'];
    const rows = users.map(u => [
      u.id,
      u.email,
      u.nameEnglish || u.fullName,
      u.nameArabic || '',
      u.phone || '',
      u.role,
      u.isActive ? 'Active' : 'Inactive',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      u.subscription?.planName || '',
    ]);
    return rowsToCsv(headers, rows);
  },

  exportCasesCSV(): string {
    const cases = mockStore.getAllCases();
    const headers = ['Case #', 'Title', 'Deceased Name', 'Estate Value', 'Madhab', 'Status', 'Heirs Count', 'Created At'];
    const rows = cases.map(c => [
      c.caseNumber,
      c.title,
      c.deceased_name || '',
      String(c.total_estate ?? 0),
      c.madhab || '',
      c.status,
      String(c.heirs?.length ?? 0),
      new Date(c.createdAt).toLocaleDateString(),
    ]);
    return rowsToCsv(headers, rows);
  },

  exportLogsCSV(): string {
    const logs = mockStore.getLogs();
    const headers = ['Timestamp', 'User Email', 'Action', 'Details', 'Level', 'IP'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.userEmail,
      l.action,
      l.details,
      l.level,
      l.ip,
    ]);
    return rowsToCsv(headers, rows);
  },
};

// ── Download helper ─────────────────────────────────────────────────────────
export function downloadCsv(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
