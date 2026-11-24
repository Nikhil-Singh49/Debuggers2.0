import { useEffect, useState } from 'react';

export default function Modal({ title, children, onClose, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-xs transition-opacity animate-fade-in md:items-center md:p-4" 
      onClick={onClose}
    >
      <div 
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-toast animate-sheet-up md:rounded-2xl md:animate-slide-up`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />
        
        <div className="mb-5 flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h3>
          <button 
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg text-muted hover:bg-slate-200 hover:text-ink transition-colors" 
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericTarget = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

  useEffect(() => {
    let startTimestamp = null;
    const startValue = 0;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + easedProgress * (numericTarget - startValue));
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(numericTarget);
      }
    };
    requestAnimationFrame(step);
  }, [numericTarget, duration]);

  if (isNaN(numericTarget) || String(value).includes('L') || String(value).includes('k')) {
    return <span>{value}</span>;
  }

  return (
    <span>
      {prefix}{displayValue.toLocaleString('en-IN')}{suffix}
    </span>
  );
}

export function AttendanceProgressRing({ current = 72, target = 75, size = 150 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (current / 100) * circumference;
  const isBelow = current < target;
  const diff = Math.abs(current - target);

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isBelow ? '#EF4444' : '#84CC16'}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-3xl font-bold text-ink tracking-tight">{current}%</span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Attendance</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
        <span className={`px-2.5 py-0.5 rounded-full border ${isBelow ? 'bg-red-50 text-red-700 border-red-200' : 'bg-lime-50 text-lime-800 border-lime-200'}`}>
          {isBelow ? `⚠️ ${diff}% Below Target (${target}%)` : `✓ Target ${target}% Requirement Met`}
        </span>
      </div>
    </div>
  );
}

export function Stat({ label, icon, value, note, tone = 'blue', trend }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-lime-50 text-lime-800 border-lime-200',
    violet: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <article className="card relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-transform group-hover:scale-105 ${tones[tone] || tones.blue}`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <strong className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight">
          <AnimatedNumber value={value} />
        </strong>
        {trend && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-lime-50 text-lime-800 border border-lime-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {trend}
          </span>
        )}
      </div>
      {note && <p className="mt-1 text-[11px] font-medium text-slate-500">{note}</p>}
    </article>
  );
}

export function AiCard({ title, subtitle, points = [], actionText, onAction, type = 'insight' }) {
  const isWarning = type === 'warning';
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
      isWarning 
        ? 'border-amber-200 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white' 
        : 'border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-lime-50/40 to-white backdrop-blur-md shadow-sm'
    }`}>
      <div className="flex items-center justify-between">
        <span className={`tag font-bold ${isWarning ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
          ✦ {isWarning ? 'EARLY WARNING' : 'AI INSIGHT'}
        </span>
        <span className="text-[10px] font-semibold text-muted">Updated real-time</span>
      </div>
      
      <h3 className="mt-3 font-display text-base font-bold text-ink">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-600 leading-relaxed">{subtitle}</p>}

      {points.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
          {points.map((pt, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className={`mt-0.5 text-[10px] ${isWarning ? 'text-amber-600' : 'text-blue-600'}`}>•</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      )}

      {actionText && (
        <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-end">
          <button 
            onClick={onAction}
            className={`btn-touch px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isWarning 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs' 
                : 'bg-blue hover:bg-blue-dark text-white shadow-xs'
            }`}
          >
            {actionText} →
          </button>
        </div>
      )}
    </div>
  );
}

export function Badge({ children, status = 'default' }) {
  const styles = {
    present: 'bg-green-soft text-green border-green/20',
    paid: 'bg-green-soft text-green border-green/20',
    absent: 'bg-red-soft text-red border-red/20',
    overdue: 'bg-red-soft text-red border-red/20',
    late: 'bg-orange-soft text-orange border-orange/20',
    pending: 'bg-amber-soft text-amber-700 border-amber/20',
    holiday: 'bg-indigo-soft text-indigo border-indigo/20',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={`tag border ${styles[status.toLowerCase()] || styles.default}`}>
      {children}
    </span>
  );
}

export function SkeletonLoader({ count = 3, type = 'card' }) {
  if (type === 'table') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-12 skeleton w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 skeleton card" />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, actionText, onAction, icon = '📭' }) {
  return (
    <div className="card flex flex-col items-center justify-center p-8 text-center my-4">
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-muted max-w-sm">{description}</p>
      {actionText && (
        <button onClick={onAction} className="btn-primary mt-4">
          {actionText}
        </button>
      )}
    </div>
  );
}

export function PaymentSuccessModal({ payment, onClose }) {
  if (!payment) return null;
  return (
    <Modal title="Payment Verified" onClose={onClose}>
      <div className="text-center space-y-4 py-2">
        <div         className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-100 text-lime-800 text-3xl font-bold animate-pop-in shadow-md shadow-lime-500/20">
          ✓
        </div>

        <div>
          <h3 className="font-display text-2xl font-bold text-ink">Payment Successful</h3>
          <p className="text-xs text-muted mt-1">Transaction verified & digital receipt generated.</p>
        </div>

        <div className="rounded-2xl border border-line bg-canvas p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-muted">Amount Paid:</span>
            <strong className="text-ink font-bold">₹{payment.amount.toLocaleString('en-IN')}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Transaction ID:</span>
            <strong className="font-mono text-slate-700">{payment.txn}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Student:</span>
            <strong className="text-ink">{payment.student}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Payment Method:</span>
            <strong className="text-ink">{payment.method}</strong>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => window.print()} className="btn-outline flex-1">
            🖨 Download Receipt
          </button>
          <button onClick={onClose} className="btn-primary flex-1">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ReceiptModal({ payment, onClose }) {
  if (!payment) return null;
  return <PaymentSuccessModal payment={payment} onClose={onClose} />;
}


