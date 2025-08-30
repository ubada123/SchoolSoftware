import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for valid token on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Validate token by making a test API call
      const validateToken = async () => {
        try {
          const response = await axios.get('/api/classrooms/', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.status === 200) {
            setAccessToken(token);
            setUser({ username: 'user' }); // We could decode the token to get actual username
          } else {
            localStorage.removeItem('accessToken');
          }
        } catch (error) {
          console.log('Token validation failed, removing from localStorage');
          localStorage.removeItem('accessToken');
        } finally {
          setLoading(false);
        }
      };
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  console.log('AuthProvider initialized:', { 
    hasToken: !!accessToken, 
    tokenLength: accessToken?.length,
    user: !!user,
    loading 
  });

  const login = async (username, password) => {
    setLoading(true);
    try {
      console.log('Attempting login with:', { username, password });
      const res = await axios.post('/api/auth/token/', { username, password });
      console.log('Login successful:', res.data);
      localStorage.setItem('accessToken', res.data.access);
      setAccessToken(res.data.access);
      setUser({ username });
      return true;
    } catch (e) {
      console.error('Login failed:', e.response?.data || e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out, clearing token and user data');
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    setUser(null);
    // Force redirect to login page
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ accessToken, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
