import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

function profileKey(user) {
  return `edupulseProfile:${user.id ?? user.email}`;
}

function withSavedProfile(user) {
  const savedProfile = localStorage.getItem(profileKey(user));
  if (!savedProfile) return user;
  try {
    const profile = JSON.parse(savedProfile);
    const displayName = user.displayName || profile.displayName || user.name;
    return {
      ...user,
      displayName,
      initials: displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      profilePicture: profile.profilePicture || '',
    };
  } catch (error) {
    console.error('Could not load the saved student profile', error);
    return user;
  }
}

function saveSession(user) {
  const sessionUser = { ...user };
  delete sessionUser.profilePicture;
  localStorage.setItem('edupulseSession', JSON.stringify({ user: sessionUser }));
}

export function AuthProvider({ children }) {
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem('edupulseSession') || 'null');
    } catch {
      return null;
    }
  })();
  const [user, setUser] = useState(saved?.user ? withSavedProfile(saved.user) : null);

  useEffect(() => {
    if (!localStorage.getItem('edupulseToken')) return;
    api.get('/auth/me').catch((error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('edupulseToken');
        localStorage.removeItem('edupulseSession');
        setUser(null);
      }
    });
  }, []);

  const login = async ({ email, password, role }) => {
    const { data } = await api.post('/auth/login', { email, password, role });
    const authenticatedUser = withSavedProfile(data.user);
    localStorage.setItem('edupulseToken', data.token);
    saveSession(authenticatedUser);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const updateProfile = async ({ displayName, profilePicture }) => {
    if (!user) throw new Error('You must be signed in to update your profile.');
    const normalizedName = displayName.trim();
    if (!normalizedName) throw new Error('Enter a name before saving.');

    const { data } = await api.put('/auth/profile', { displayName: normalizedName });
    const initials = normalizedName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
    const profile = {
      profilePicture: profilePicture || '',
    };
    localStorage.setItem(profileKey(user), JSON.stringify(profile));
    const updatedUser = { ...user, displayName: data.displayName, initials, profilePicture: profile.profilePicture };
    saveSession(updatedUser);
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    localStorage.removeItem('edupulseToken');
    localStorage.removeItem('edupulseSession');
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout, updateProfile }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
