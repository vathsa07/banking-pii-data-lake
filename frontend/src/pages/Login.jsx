import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, KeyRound, AlertCircle, ArrowRight, Database } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('alice_analyst');
  const [password, setPassword] = useState('analyst123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickSelect = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8000/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      login(data);

      // Redirect based on role
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'compliance_officer') navigate('/compliance');
      else navigate('/analyst');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Shield className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-100 tracking-tight">
          Banking PII Data Lake
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Role-Based Access Control & Governance Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Quick Demo Accounts
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('alice_analyst', 'analyst123')}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                  username === 'alice_analyst'
                    ? 'bg-blue-950/60 border-blue-500/60 text-blue-300'
                    : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-200">Alice Analyst</span>
                  <span className="ml-2 text-slate-400">(Role: Data Analyst)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/40">Masked PII</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('carol_compliance', 'compliance123')}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                  username === 'carol_compliance'
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-200">Carol Compliance</span>
                  <span className="ml-2 text-slate-400">(Role: Compliance Officer)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/40">Unmasked PII</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('admin_user', 'admin123')}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                  username === 'admin_user'
                    ? 'bg-purple-950/60 border-purple-500/60 text-purple-300'
                    : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-200">Admin User</span>
                  <span className="ml-2 text-slate-400">(Role: Admin)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/40">Full Control</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
