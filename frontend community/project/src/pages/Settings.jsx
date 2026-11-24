import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSchool } from '../context/SchoolContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { SkeletonLoader } from '../components/ui.jsx';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { data, refresh } = useSchool();
  const toast = useToast();
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      displayName: user.displayName || user.name,
      minAttendance: 75,
      teacherCanEdit: 'true',
    },
    values: data ? {
      minAttendance: data.settings.minAttendance,
      teacherCanEdit: String(data.settings.teacherCanEdit),
      displayName: user.displayName || user.name,
    } : undefined,
  });

  if (!data && user.role === 'Admin') return <SkeletonLoader count={1} />;

  const saveStudentProfile = async ({ displayName }) => {
    try {
      await updateProfile({ displayName, profilePicture });
      toast('✓ Profile name saved; picture updated on this device');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not save your profile');
    }
  };

  const selectProfilePicture = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('Choose a JPG, PNG, or WebP image for your profile picture');
      event.target.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      toast('Choose an image smaller than 1 MB');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => toast('Could not read that image file');
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        toast('Could not preview that image file');
        return;
      }
      setProfilePicture(reader.result);
    };
    reader.readAsDataURL(file);
  };

  if (user.role !== 'Admin') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-lime-300/20 blur-3xl" />
          <div className="relative flex flex-col items-center gap-5 sm:flex-row">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white/40 bg-white/15 text-2xl font-bold shadow-lg">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                user.initials || user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')
              )}
            </div>
            <div className="text-center sm:text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">{user.role} account</span>
              <h2 className="mt-1 font-display text-2xl font-bold">Profile settings</h2>
              <p className="mt-1 max-w-lg text-sm text-blue-100">
                Personalize the name and picture shown in your EduPulse account.
              </p>
            </div>
          </div>
        </header>

        <article className="card">
          <form className="space-y-6" onSubmit={handleSubmit(saveStudentProfile)}>
            <div>
              <label htmlFor="displayName" className="mb-1.5 block text-xs font-bold text-ink">Display name</label>
              <input
                id="displayName"
                autoComplete="name"
                className="input"
                {...register('displayName', {
                  required: 'Enter your name',
                  maxLength: { value: 100, message: 'Name must be 100 characters or fewer' },
                  validate: (value) => Boolean(value.trim()) || 'Enter your name',
                })}
              />
              {errors.displayName && (
                <p role="alert" className="mt-1 text-xs text-red-700">{errors.displayName.message}</p>
              )}
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-bold text-ink">Profile picture</span>
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Choose a picture</p>
                  <p className="mt-1 text-xs text-muted">Image files up to 1 MB. Saved on this device only.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="btn-outline cursor-pointer px-3 py-2 text-xs font-semibold">
                    Upload image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={selectProfilePicture}
                    />
                  </label>
                  {profilePicture && (
                    <button
                      type="button"
                      className="btn-outline px-3 py-2 text-xs font-semibold"
                      onClick={() => setProfilePicture('')}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-outline px-4 py-2.5 text-xs font-semibold"
                onClick={() => {
                  setProfilePicture(user.profilePicture || '');
                  reset({ displayName: user.displayName || user.name });
                }}
              >
                Discard changes
              </button>
              <button className="btn-primary px-5 py-2.5 text-xs font-bold">
                Save profile
              </button>
            </div>
          </form>
        </article>
      </div>
    );
  }

  const saveSettings = async (values) => {
    await api.put('/settings', { 
      minAttendance: Number(values.minAttendance), 
      teacherCanEdit: values.teacherCanEdit === 'true' 
    });
    toast(`✓ Global minimum attendance threshold set to ${values.minAttendance}%`);
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">System & Academic Settings</h2>
        <p className="text-xs text-muted">Configure minimum attendance policy requirements and teacher register permissions.</p>
      </div>

      <article className="card">
        <form className="space-y-5" onSubmit={handleSubmit(saveSettings)}>
          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Minimum Required Attendance Policy Threshold (%)
            </label>
            <select className="input font-bold" {...register('minAttendance')}>
              <option value="60">60% Minimum Attendance Target</option>
              <option value="75">75% Standard Requirement (Recommended)</option>
              <option value="85">85% Strict Requirement</option>
            </select>
            <span className="block text-[11px] text-muted mt-1">
              Students falling below this percentage will be automatically flagged in At-Risk rosters and AI Early Warning cards.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Teacher Register Modification Permission
            </label>
            <select className="input" {...register('teacherCanEdit')}>
              <option value="true">Allowed — Teachers may edit marked register entries</option>
              <option value="false">Restricted — Only Admin may modify finalized registers</option>
            </select>
          </div>

          <div className="pt-3 border-t border-line">
            <button className="btn-primary w-full py-3 text-xs font-bold">
              Save & Apply Settings →
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}

