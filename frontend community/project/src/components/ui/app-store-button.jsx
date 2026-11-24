import { Apple, Download } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export function AppStoreButton({ className }) {
  return (
    <span className={cn(
      'group inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue/10',
      className
    )}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue transition-transform duration-300 group-hover:scale-110">
        <Apple className="h-4 w-4" />
      </span>
      <span className="leading-none text-left">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Download on the</span>
        <span className="mt-1 block text-xs font-bold text-slate-900">App Store</span>
      </span>
      <Download className="h-4 w-4 text-slate-500 transition-colors duration-300 group-hover:text-blue" />
    </span>
  );
}

export default AppStoreButton;
