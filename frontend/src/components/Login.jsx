import { useState } from 'react';
import { useApi } from '../hooks/useApi';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const { post, error, setError } = useApi(); // No token needed for login

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await post('/login', formData);
      onLogin(data);
    } catch (error) {
      console.error('Login error:', error);
      // Error is already set by useApi hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      {/* Background geometric elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-500/5 transform rotate-45"></div>
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-gray-500/10 transform rotate-12"></div>
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-slate-500/5 transform -rotate-12"></div>
        <div className="absolute top-3/4 left-1/4 w-32 h-32 bg-gray-400/10 transform rotate-45"></div>
      </div>
      
      {/* Login form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm border border-gray-300 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 mb-4 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to Poster Management</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-800 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label 
                htmlFor="username" 
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                  focusedField === 'username' || formData.username
                    ? '-top-2 text-xs text-gray-700 font-semibold bg-white px-1'
                    : 'top-4 text-gray-500'
                }`}
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField('')}
                required
                className="w-full p-4 bg-white border border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-gray-500 transition-all duration-300 shadow-sm"
                placeholder="Enter your username"
              />
            </div>

            <div className="relative">
              <label 
                htmlFor="password" 
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                  focusedField === 'password' || formData.password
                    ? '-top-2 text-xs text-gray-700 font-semibold bg-white px-1'
                    : 'top-4 text-gray-500'
                }`}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                required
                className="w-full p-4 bg-white border border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-gray-500 transition-all duration-300 shadow-sm"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-4 bg-gray-800 hover:bg-gray-900 text-white font-semibold shadow-md transform transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
            >
              <span className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Secure access to your campaigns
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;