import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const toast = useCallback((text) => {
    setMessage(text);
    setOpen(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), 2400);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={`fixed bottom-6 right-7 z-50 flex items-center gap-2 rounded-lg bg-blue px-4 py-3 text-[11px] text-white shadow-toast transition ${open ? 'translate-y-0' : 'translate-y-24'}`}>
        <span className="text-green">✓</span> {message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
