import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, User, Lock, Eye, EyeOff, AlertCircle, Sparkles, Shield } from 'lucide-react';

export default function Login() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const ok = await login(username, password);
    if (!ok) setError('Invalid credentials. Please try again.');
    else window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 pulse-glow">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          <h2 className="mt-8 text-4xl font-extrabold gradient-text">
            School Admin Portal
          </h2>
          <div className="flex items-center justify-center mt-3">
            <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
            <p className="text-sm text-gray-600">Sign in to manage students and grades</p>
            <Sparkles className="h-4 w-4 text-pink-500 ml-2" />
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div className="card shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="card-body space-y-6">
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 slide-up">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <div className="text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="username" className="form-label">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-purple-500 mr-2" />
                    Username
                  </div>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    required
                    className="form-input pl-12 hover:border-purple-300 focus:border-purple-500"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="form-label">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-purple-500 mr-2" />
                    Password
                  </div>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input pl-12 pr-12 hover:border-purple-300 focus:border-purple-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center focus-ring"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-blue-400 hover:text-purple-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-blue-400 hover:text-purple-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-4 text-base font-semibold hover-lift"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="loading-spinner h-6 w-6 mr-3"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Sign in
                    </div>
                  )}
                </button>
              </div>

              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-xs text-gray-600 font-medium">
                    Demo credentials: <span className="font-bold text-purple-600">admin</span> / <span className="font-bold text-purple-600">Admin@12345</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
