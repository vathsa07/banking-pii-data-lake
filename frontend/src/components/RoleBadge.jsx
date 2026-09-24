import React from 'react';
import { ShieldCheck, ShieldAlert, UserCheck } from 'lucide-react';

export const RoleBadge = ({ role }) => {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-700/50">
        <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
        System Administrator
      </span>
    );
  }
  if (role === 'compliance_officer') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        Compliance Officer
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-700/50">
      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
      Data Analyst
    </span>
  );
};
