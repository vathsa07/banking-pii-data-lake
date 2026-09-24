import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/RoleBadge';

export const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 text-center">
      <div className="p-4 bg-rose-950/60 text-rose-400 rounded-2xl border border-rose-800/50 mb-4">
        <ShieldAlert className="w-12 h-12" />
      </div>
      
      <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">403 - Access Restricted</h1>
      <p className="mt-2 text-sm text-slate-400 max-w-md">
        Your current account role does not have authorization to view this page under banking data governance rules.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-slate-400">Your Current Role:</span>
        <RoleBadge role={user?.role} />
      </div>

      <div className="mt-8 flex items-center space-x-4">
        <Link
          to="/analyst"
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Data Explorer
        </Link>
      </div>
    </div>
  );
};
