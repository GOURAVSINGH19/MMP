import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token exists in localStorage on startup and load user
  useEffect(() => {
    const token = localStorage.getItem('mmp_token');
    const storedUser = localStorage.getItem('mmp_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('mmp_token');
        localStorage.removeItem('mmp_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: loggedUser } = response.data;

      localStorage.setItem('mmp_token', token);
      localStorage.setItem('mmp_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    } catch (error) {
      throw error.response?.data?.error || 'Invalid credentials';
    }
  };

  const register = async (name, email, phone, password, role = 'PARTICIPANT') => {
    try {
      const response = await api.post('/auth/register', { name, email, phone, password, role });
      const { token, user: registeredUser } = response.data;

      localStorage.setItem('mmp_token', token);
      localStorage.setItem('mmp_user', JSON.stringify(registeredUser));
      setUser(registeredUser);
      return registeredUser;
    } catch (error) {
      throw error.response?.data?.error || 'Registration failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('mmp_token');
    localStorage.removeItem('mmp_user');
    setUser(null);
  };

  const isParticipant = () => user?.role === 'PARTICIPANT';
  const isOrganizer = () => user?.role === 'ORGANIZER';
  const isVolunteer = () => user?.role === 'VOLUNTEER';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isParticipant, isOrganizer, isVolunteer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
