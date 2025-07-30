import { useState } from 'react';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

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
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Login form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-black/40 border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-100 mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to Poster Management</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-red-300 text-center backdrop-blur-sm animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label 
                htmlFor="username" 
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                  focusedField === 'username' || formData.username
                    ? '-top-2 text-xs bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent font-semibold'
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
                className="w-full p-4 bg-black/30 border border-gray-700/50 rounded-xl text-gray-100 placeholder-transparent focus:outline-none focus:border-gray-500 focus:bg-black/50 transition-all duration-300 backdrop-blur-sm"
                placeholder="Enter your username"
              />
            </div>

            <div className="relative">
              <label 
                htmlFor="password" 
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                  focusedField === 'password' || formData.password
                    ? '-top-2 text-xs bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent font-semibold'
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
                className="w-full p-4 bg-black/30 border border-gray-700/50 rounded-xl text-gray-100 placeholder-transparent focus:outline-none focus:border-gray-500 focus:bg-black/50 transition-all duration-300 backdrop-blur-sm"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-100 font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
            >
              <span className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400/0 via-gray-400/20 to-gray-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
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