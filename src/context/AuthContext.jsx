import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/db';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try { 
          const parsed = JSON.parse(storedUser);
          // Check if user was banned by fetching fresh data
          const allUsers = await api.getAllUsers();
          const fresh = allUsers.find(u => String(u.id) === String(parsed.id));
          if (fresh?.banned) {
            logout();
            toast.error('Your account has been banned.');
          } else if (fresh) {
            setUser(fresh);
            localStorage.setItem('currentUser', JSON.stringify(fresh));
          } else {
            setUser(parsed);
          }
        } catch (e) {
          console.error('[AUTH] Init failed:', e);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const userData = await api.login(username, password);
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      toast.success('Logged in successfully');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      const userData = await api.register(username, email, password);
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      toast.success('Registered successfully');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    toast.success('Logged out');
  };

  // Update user object in state + storage (for username/email changes)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
