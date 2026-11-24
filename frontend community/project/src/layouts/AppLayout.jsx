import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { NAV_BY_ROLE } from '../data/seed.js';
import {
  MotionNavigationMenu,
  MotionNavigationMenuList,
  MotionNavigationMenuItem,
  MotionNavigationMenuTrigger,
  MotionNavigationMenuContent,
  MotionNavigationMenuLink,
} from '@/components/ui/motion-navigation-menu.jsx';
import {
  LayoutDashboard,
  CalendarCheck,
  IndianRupee,
  Users,
  GraduationCap,
  CalendarDays,
  Bus,
  Megaphone,
  BarChart3,
  MessageCircle,
  Bell,
  Settings,
  Search,
  LogOut,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  Shield,
} from 'lucide-react';
import { Footer2 } from '@/components/ui/footer-2.jsx';

const ITEMS = [
  { to: '/app/dashboard', key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/app/attendance', key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/app/fees', key: 'fees', label: 'Fees & Accounts', icon: IndianRupee },
  { to: '/app/students', key: 'students', label: 'Students', icon: Users },
  { to: '/app/teachers', key: 'teachers', label: 'Teachers', icon: GraduationCap },
  { to: '/app/timetable', key: 'timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/app/transport', key: 'transport', label: 'Transport', icon: Bus },
  { to: '/app/announcements', key: 'announcements', label: 'Announcements', icon: Megaphone },
  { to: '/app/analytics', key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/feedback', key: 'feedback', label: 'Feedback', icon: MessageCircle },
  { to: '/app/notifications', key: 'notifications', label: 'Notifications', icon: Bell },
  { to: '/app/settings', key: 'settings', label: 'Settings', icon: Settings },
];

// Group nav items for the mega-menu dropdown structure
const NAV_GROUPS = {
  academics: {
    label: 'Academics',
    keys: ['dashboard', 'attendance', 'timetable', 'analytics'],
  },
  people: {
    label: 'People',
    keys: ['students', 'teachers', 'feedback'],
  },
  finance: {
    label: 'Finance & Ops',
    keys: ['fees', 'transport'],
  },
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { data } = useSchool();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'obsidian');
  }, []);

  const allowed = NAV_BY_ROLE[user?.role] || [];
  const pending = data?.pendingSync?.length || 0;
  const activeNav = ITEMS.filter((i) => allowed.includes(i.key));
  const currentPage = ITEMS.find((i) => location.pathname.startsWith(i.to))?.label || 'Overview';

  // Mobile quick nav items (top 4 for current role)
  const mobileQuickItems = activeNav.slice(0, 4);

  // Build filtered nav groups for the current role
  const getGroupItems = (groupKeys) =>
    ITEMS.filter((i) => groupKeys.includes(i.key) && allowed.includes(i.key));

  const academicItems = getGroupItems(NAV_GROUPS.academics.keys);
  const peopleItems = getGroupItems(NAV_GROUPS.people.keys);
  const financeItems = getGroupItems(NAV_GROUPS.finance.keys);

  const highlightClassName = 'bg-blue-50 rounded-lg';

  return (
    <div data-theme="obsidian" className="app-shell relative flex flex-col min-h-screen w-full overflow-hidden font-sans antialiased text-slate-900 selection:bg-blue selection:text-white transition-colors duration-300" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      {/* Subtle Background Radial Grid Glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--ai-glow)' }} />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--ai-glow)' }} />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--ai-glow)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.04]" />
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TOP NAVIGATION BAR — Motion Navigation Menu            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 backdrop-blur-2xl transition-colors" style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-color)' }}>
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-8">
          {/* Left: Logo + Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-700 md:hidden"
              onClick={() => setOpen(true)}
            >
              ☰
            </button>
            <NavLink to="/app/dashboard" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-lime-500 text-white font-bold text-sm shadow-lg shadow-blue/20">
                E
              </span>
              <span className="hidden sm:inline">EduPulse</span>
              <span aria-hidden="true" className="hidden sm:inline -ml-1 text-lime-600 font-black">/</span>
            </NavLink>

            {/* Desktop Motion Navigation Menu */}
            <div className="hidden md:flex ml-4">
              <MotionNavigationMenu
                viewport={true}
                viewportClassName="rounded-xl border-slate-200 bg-white/95 backdrop-blur-xl shadow-xl"
              >
                <MotionNavigationMenuList>
                  {/* ── Academics Dropdown ── */}
                  {academicItems.length > 0 && (
                    <MotionNavigationMenuItem value="academics">
                      <MotionNavigationMenuTrigger className="text-slate-700 text-xs">
                        Academics
                      </MotionNavigationMenuTrigger>
                      <MotionNavigationMenuContent highlightClassName={highlightClassName}>
                        <div className="grid w-[440px] grid-cols-[1fr_1.2fr] gap-2">
                          {/* Featured card */}
                          <div
                            onClick={() => navigate('/app/dashboard')}
                            className="flex cursor-pointer flex-col justify-between rounded-xl bg-gradient-to-br from-blue-50 via-white to-lime-50 border border-blue-100 p-4 min-h-[160px] hover:border-blue-300 transition-all"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white">
                              <LayoutDashboard className="h-4 w-4 text-blue" />
                            </span>
                            <span className="space-y-1">
                              <span className="block text-sm font-semibold text-slate-900">Command Center</span>
                              <span className="block text-[11px] text-slate-600 leading-relaxed">
                                Monitor school metrics, AI insights, and attendance trends at a glance.
                              </span>
                            </span>
                          </div>
                          {/* Grid items */}
                          <div className="grid grid-cols-2 gap-0.5">
                            {academicItems.map((item) => (
                              <MotionNavigationMenuLink
                                key={item.key}
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(item.to);
                                }}
                                className="cursor-pointer"
                              >
                                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-800">
                                  <span className="flex items-center gap-2">
                                    <item.icon className="h-3.5 w-3.5 text-blue" />
                                    {item.label}
                                  </span>
                                  <ArrowUpRight className="h-3 w-3 text-slate-500" />
                                </span>
                                <span className="text-[11px] text-slate-600">
                                  {item.key === 'dashboard' && 'Live metrics & AI cards'}
                                  {item.key === 'attendance' && 'Progress ring & prediction'}
                                  {item.key === 'timetable' && 'Weekly class schedule'}
                                  {item.key === 'analytics' && 'Reports & trend charts'}
                                </span>
                              </MotionNavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </MotionNavigationMenuContent>
                    </MotionNavigationMenuItem>
                  )}

                  {/* ── People Dropdown ── */}
                  {peopleItems.length > 0 && (
                    <MotionNavigationMenuItem value="people">
                      <MotionNavigationMenuTrigger className="text-slate-700 text-xs">
                        People
                      </MotionNavigationMenuTrigger>
                      <MotionNavigationMenuContent highlightClassName={highlightClassName}>
                        <div className="w-[340px] space-y-1">
                          <div className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Manage People
                          </div>
                          {peopleItems.map((item) => (
                            <MotionNavigationMenuLink
                              key={item.key}
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(item.to);
                              }}
                              className="cursor-pointer grid grid-cols-[auto_1fr_auto] items-center gap-3"
                            >
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                                <item.icon className="h-4 w-4 text-blue" />
                              </span>
                              <span className="space-y-0.5">
                                <span className="block text-xs font-semibold text-slate-800">{item.label}</span>
                                <span className="block text-[11px] text-slate-600">
                                  {item.key === 'students' && 'Roster, profiles, and health reports'}
                                  {item.key === 'teachers' && 'Staff directory & assignments'}
                                  {item.key === 'feedback' && 'Monthly student evaluations'}
                                </span>
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                View →
                              </span>
                            </MotionNavigationMenuLink>
                          ))}
                        </div>
                      </MotionNavigationMenuContent>
                    </MotionNavigationMenuItem>
                  )}

                  {/* ── Finance & Ops Dropdown ── */}
                  {financeItems.length > 0 && (
                    <MotionNavigationMenuItem value="finance">
                      <MotionNavigationMenuTrigger className="text-slate-700 text-xs">
                        Finance & Ops
                      </MotionNavigationMenuTrigger>
                      <MotionNavigationMenuContent highlightClassName={highlightClassName}>
                        <div className="grid w-[420px] grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            {financeItems.map((item) => (
                              <MotionNavigationMenuLink
                                key={item.key}
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(item.to);
                                }}
                                className="cursor-pointer"
                              >
                                <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                                  <item.icon className="h-3.5 w-3.5 text-lime-700" />
                                  {item.label}
                                </span>
                                <span className="text-[11px] text-slate-600">
                                  {item.key === 'fees' && 'FinTech payments & receipts'}
                                  {item.key === 'transport' && 'Route management & tracking'}
                                </span>
                              </MotionNavigationMenuLink>
                            ))}
                          </div>
                          {/* Featured CTA card */}
                          <div
                            onClick={() => navigate('/app/fees')}
                            className="flex cursor-pointer flex-col justify-between rounded-xl bg-gradient-to-br from-lime-50 via-white to-blue-50 border border-lime-200 p-4 min-h-[140px] hover:border-lime-400 transition-all"
                          >
                            <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                              <Sparkles className="h-4 w-4 text-lime-700" />
                              Fee Collection
                            </span>
                            <span className="text-[11px] text-slate-600">
                              Instant FinTech gateway, payment verification, and digital receipts.
                            </span>
                            <span className="text-[11px] font-semibold text-lime-800">Open Dashboard →</span>
                          </div>
                        </div>
                      </MotionNavigationMenuContent>
                    </MotionNavigationMenuItem>
                  )}

                  {/* ── Announcements Direct Link ── */}
                  {allowed.includes('announcements') && (
                    <MotionNavigationMenuItem>
                      <MotionNavigationMenuLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/app/announcements');
                        }}
                        className="cursor-pointer flex h-9 items-center px-4 py-2 text-xs font-medium text-slate-700 hover:text-blue"
                      >
                        Announcements
                      </MotionNavigationMenuLink>
                    </MotionNavigationMenuItem>
                  )}
                </MotionNavigationMenuList>
              </MotionNavigationMenu>
            </div>
          </div>

          {/* Right: Search + Notifications + Profile */}
          <div className="flex items-center gap-2.5">
            {/* Search Bar */}
            <div className="hidden md:flex h-9 w-48 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/15 transition-all">
              <Search className="h-3.5 w-3.5" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Notification Bell */}
            <button
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 transition-colors"
              onClick={() => navigate('/app/notifications')}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-lime animate-pulse-soft" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-left hover:bg-blue-50 transition-colors"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt=""
                    className="h-7 w-7 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-100 font-bold text-[10px] text-lime-800">
                    {user?.initials || 'U'}
                  </span>
                )}
                <span className="hidden sm:block min-w-0">
                  <strong className="block truncate text-[11px] font-bold text-slate-900">{user?.displayName || user?.name}</strong>
                  <span className="block text-[9px] text-slate-500">{user?.role}</span>
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
              </button>

              {menu && (
                <div className="absolute top-12 right-0 z-50 w-48 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xl p-1.5 shadow-xl animate-slide-up">
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 transition-colors"
                    onClick={() => { setMenu(false); navigate('/app/settings'); }}
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" /> Account Settings
                  </button>
                  <div className="my-1 border-t border-slate-200" />
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
                    onClick={logout}
                  >
                    <LogOut className="h-3.5 w-3.5" /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breadcrumb Sub-Bar */}
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 pb-2">
          <span className="text-[10px] font-semibold text-slate-500 tracking-wide uppercase">
            {user?.role} Workspace <span className="mx-1 font-black text-lime-600">/</span> <b className="font-bold text-blue">{currentPage}</b>
          </span>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MOBILE SIDEBAR (slide-over drawer)                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white/95 backdrop-blur-2xl p-5 transition-transform duration-300 md:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-lime-500 text-white font-bold text-sm shadow-lg shadow-blue/20">
              E
            </span>
            <span>EduPulse</span>
            <span aria-hidden="true" className="-ml-1 text-lime-600 font-black">/</span>
          </div>
          <button
            aria-label="Close sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 font-bold text-xs text-blue">
            KM
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-xs font-bold text-slate-900">K.R. Mangalam University</strong>
            <span className="block text-[10px] font-medium text-slate-500">Senior Campus</span>
          </div>
        </div>

        <nav className="flex flex-col space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {activeNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue text-white shadow-lg shadow-blue/20'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sync status */}
        <div className="mt-auto pt-4 border-t border-slate-200 space-y-3">
          <div className={`rounded-xl border p-3 transition-colors ${
            !navigator.onLine
              ? 'border-red-200 bg-red-50 text-red-700'
              : pending
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-lime-200 bg-lime-50 text-lime-800'
          }`}>
            <strong className="block text-xs font-semibold">
              {!navigator.onLine ? 'Working Offline' : pending ? 'Sync Pending' : 'Real-time Sync Active'}
            </strong>
            <span className="block text-[10px] font-medium opacity-80">
              {pending ? `${pending} items queued` : 'All changes saved'}
            </span>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT AREA                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <main className="relative z-10 min-w-0 flex-1 flex flex-col pb-16 md:pb-0">
        <div className="mx-auto w-full max-w-[1600px] p-4 md:p-8 flex-1">
          <Outlet context={{ query }} />
        </div>
      </main>

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 border-t border-slate-200 bg-white/95 backdrop-blur-xl md:hidden px-2">
        {mobileQuickItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) => `flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-semibold transition-all ${
                isActive ? 'text-blue' : 'text-slate-500'
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-semibold text-slate-500"
        >
          <span className="text-lg">☰</span>
          <span>More</span>
        </button>
      </nav>

      <Footer2 />
    </div>
  );
}
