import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { Waves, Fish, Lock, User, Radio, Sparkles } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Australian Beach Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-teal-500">
        {/* Beach Texture Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/20"></div>
        
        {/* Wave Pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-amber-100 via-amber-50 to-transparent">
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 120" fill="none">
            <path d="M0 120L60 105C120 90 240 60 360 52.5C480 45 600 60 720 67.5C840 75 960 75 1080 60C1200 45 1320 15 1380 0L1440 -15V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#FCD34D" opacity="0.8"/>
          </svg>
        </div>

        {/* Australian Flag Colors Accent */}
        <div className="absolute top-20 right-10 flex flex-col gap-2 opacity-20">
          <div className="w-16 h-3 bg-red-600 rounded-full"></div>
          <div className="w-16 h-3 bg-blue-600 rounded-full"></div>
          <div className="w-16 h-3 bg-white rounded-full"></div>
        </div>

        {/* Animated Sun */}
        <div className="absolute top-32 left-20 w-32 h-32 bg-yellow-400 rounded-full opacity-30 blur-xl animate-pulse"></div>
      </div>

      {/* Login Card */}
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <Waves className="h-16 w-16 text-blue-600 relative" />
            <Fish className="h-8 w-8 absolute -bottom-2 -right-2 bg-red-500 rounded-full p-1" />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-extrabold text-center mb-2 text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Surfers<span className="text-blue-600">.</span>
        </h1>
        
        {/* Tagline with 5G Badge */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-purple-600">AI-Powered</span>
            <span className="text-gray-400">|</span>
            <Radio className="h-4 w-4 text-green-600" />
            <span className="bg-gradient-to-r from-green-600 to-green-700 text-white px-2 py-0.5 rounded-full font-bold text-xs">
              5G Network
            </span>
          </div>
          <p className="text-gray-700 font-medium text-sm mt-1">Real-Time Shark Alerts for Australian Beaches</p>
        </div>
        
        <div className="border-t border-gray-200 my-8"></div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="inline h-4 w-4 mr-1" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

