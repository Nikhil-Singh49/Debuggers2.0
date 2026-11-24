import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { USERS } from '../data/seed.js';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState('Admin');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const demoMode = !import.meta.env.VITE_API_URL;

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { email: demoMode ? USERS.Admin.email : '', password: '' },
  });

  const handleRoleSelect = (r) => {
    setRole(r);
    setFormError('');
    setValue('email', demoMode ? USERS[r].email : '');
  };

  const onSubmit = async (values) => {
    setLoading(true);
    setFormError('');
    try {
      await login({ ...values, email: values.email.trim(), role });
      toast(`✓ Authenticated as ${role}`);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK'
          ? 'Cannot reach the server. Start the API and try again.'
          : 'Sign in failed. Check your user ID/email, password, and selected role.');
      setFormError(message);
      toast(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-slate-50 font-sans antialiased text-slate-900 selection:bg-blue selection:text-white">
      {/* Background Animated Gradient Mesh & Floating Orbs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-blue/15 to-lime/20 opacity-50 blur-3xl animate-float-orb" />
        <div className="absolute top-1/2 right-0 h-96 w-96 rounded-full bg-gradient-to-bl from-blue/10 via-blue/5 to-lime/15 opacity-60 blur-3xl animate-float-orb" style={{ animationDelay: '-3.5s' }} />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-gradient-to-t from-lime/15 to-blue/10 opacity-60 blur-3xl animate-float-orb" style={{ animationDelay: '-1.8s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.06]" />
      </div>

      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-[1.1fr_.9fr]">
        {/* Left Hero Panel */}
        <section className="relative hidden p-12 lg:flex lg:flex-col justify-between">
          <div className="flex items-center gap-3 animate-pop-in">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue via-blue to-lime text-white font-bold text-lg shadow-lg shadow-blue/20">
              E
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900">EduPulse</span>
            <span className="ml-3 tag bg-blue-soft text-blue border border-blue-200">
              Enterprise School ERP
            </span>
          </div>

          <div className="my-auto relative max-w-xl">
            <img
              src="/lime-orbit.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-40 -top-44 w-[540px] opacity-80"
            />
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-300 bg-lime-50 px-3.5 py-1 text-xs font-semibold text-lime-800">
                <span>✦</span> Next-Gen School Operating System
              </div>

              <h1 className="font-display text-5xl xl:text-6xl font-bold tracking-tight text-slate-600 leading-[1.08]">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-2 inline-block h-8 w-8 align-[-0.15em] text-lime-600" fill="currentColor">
                  <path d="m12 1.5-1.8 4.6-3.5-1.8.8 4.1-4.3-.7 2.6 3.5-3.1 1.5 4.2 1.7-1.1 3.7 4.1-1.4L12 21l2.1-4.3 4.1 1.4-1.1-3.7 4.2-1.7-3.1-1.5 2.6-3.5-4.3.7.8-4.1-3.5 1.8L12 1.5Z" />
                </svg>
                Intelligent attendance & fee management for <span className="text-blue">modern schools.</span>
              </h1>

            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-500">
            <span>K.R. Mangalam University</span>
            <span>Protected by signed JWT authentication</span>
          </div>
        </section>

        {/* Right Glass Login Panel */}
        <section className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 backdrop-blur-2xl shadow-float animate-slide-up space-y-6">
            <div className="text-center space-y-2">
              <span className="eyebrow eyebrow-no-slash text-lime-800">Sign In</span>
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Access EduPulse Workspace
              </h2>
              <p className="text-xs text-slate-500">Select your role portal and authenticate below.</p>
            </div>

            {/* Role Selection Tabs */}
            <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              {['Admin', 'Teacher', 'Accounts', 'Student'].map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleRoleSelect(key)}
                  className={`btn-touch min-h-[38px] rounded-xl text-xs font-bold transition-all ${
                    role === key
                      ? 'bg-blue text-white shadow-md shadow-blue/20'
                      : 'text-slate-600 hover:text-blue hover:bg-blue-soft'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {formError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Email or User ID</label>
                <input
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs text-slate-900 outline-none transition-all focus:border-blue focus:ring-4 focus:ring-blue/15 placeholder:text-slate-400"
                  {...register('email', { required: true })}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
                  <label className="text-slate-700">Password</label>
                  <span className="text-blue hover:underline cursor-pointer">Forgot password?</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={show ? 'text' : 'password'}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-4 pr-12 text-xs text-slate-900 outline-none transition-all focus:border-blue focus:ring-4 focus:ring-blue/15"
                    {...register('password', { required: true })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-xs font-bold text-lime-800 hover:text-lime-900"
                    onClick={() => setShow((v) => !v)}
                  >
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-center text-[11px] text-slate-600">
                {demoMode
                  ? `Demo sign-in: ${USERS[role].email} · password Demo@2026`
                  : 'Use the active account credentials provided by your school administrator.'}
              </div>

              <button
                disabled={loading}
                className="btn-touch w-full h-12 rounded-xl bg-blue font-display text-sm font-bold text-white shadow-lg shadow-blue/20 hover:bg-blue-dark active:scale-[0.99] transition-all"
              >
                {loading ? 'Authenticating Workspace...' : `Sign In as ${role} →`}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

