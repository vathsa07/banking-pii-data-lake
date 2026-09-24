import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './RoleBadge';
import { Database, ShieldCheck, Activity, LogOut, Play, CheckCircle2 } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [triggering, setTriggering] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTriggerPipeline = async () => {
    setTriggering(true);
    setStatusMsg('Running pipeline...');
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8000/pipeline/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setStatusMsg('Pipeline completed!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatusMsg('Trigger failed');
      }
    } catch (e) {
      setStatusMsg('Error triggering pipeline');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 tracking-tight text-lg">Banking PII Data Lake</h1>
              <p className="text-xs text-slate-400">Medallion Governance & RBAC Portal</p>
            </div>
          </div>

          {/* Navigation Links based on role */}
          <nav className="flex items-center space-x-1">
            <NavLink
              to="/analyst"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                }`
              }
            >
              Gold Data Explorer
            </NavLink>

            {(user?.role === 'compliance_officer' || user?.role === 'admin') && (
              <NavLink
                to="/compliance"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                  }`
                }
              >
                Compliance Audit Trail
              </NavLink>
            )}

            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-500'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                  }`
                }
              >
                Pipeline Health & Quality
              </NavLink>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleTriggerPipeline}
              disabled={triggering}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
            >
              {triggering ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {triggering ? 'Executing...' : 'Run Pipeline'}
            </button>

            {statusMsg && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {statusMsg}
              </span>
            )}

            <div className="h-6 w-px bg-slate-800"></div>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-slate-200">{user?.username}</p>
                <RoleBadge role={user?.role} />
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
