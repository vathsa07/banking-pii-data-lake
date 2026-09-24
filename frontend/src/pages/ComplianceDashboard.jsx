import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, Lock, Unlock, Users, DollarSign, FileText, Search, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export const ComplianceDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' or 'gold'
  const [goldData, setGoldData] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingGold, setLoadingGold] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [error, setError] = useState(null);
  const [searchAudit, setSearchAudit] = useState('');

  const fetchGoldData = async () => {
    setLoadingGold(true);
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8000/data/gold`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        setGoldData(result.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingGold(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8000/audit-log?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        setAuditLogs(result.logs || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchGoldData();
    fetchAuditLogs();
  }, [token]);

  const filteredLogs = auditLogs.filter(log => 
    log.username?.toLowerCase().includes(searchAudit.toLowerCase()) ||
    log.role_name?.toLowerCase().includes(searchAudit.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchAudit.toLowerCase())
  );

  const piiExposedCount = auditLogs.filter(l => l.pii_exposed).length;
  const totalRecordsRead = auditLogs.reduce((sum, l) => sum + (l.records_returned || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Alert for Authorized Unmasked View */}
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-start gap-3">
          <Unlock className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-200">Compliance Audit Access Granted</h3>
            <p className="text-xs text-emerald-300/80 mt-0.5">
              You are logged in as a <strong>Compliance Officer</strong>. You have authorization to view unmasked PII for auditing purposes. Every access attempt is immutably recorded in the PostgreSQL audit log.
            </p>
          </div>
        </div>

        {/* Tab Toggle Header */}
        <div className="flex border-b border-slate-800 mb-6 space-x-6">
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Compliance Audit Trail ({auditLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('gold')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'gold'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Unlock className="w-4 h-4" />
            Unmasked Gold Customer Data
          </button>
        </div>

        {/* TAB 1: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            
            {/* Audit Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Logged Query Events</p>
                  <h4 className="text-2xl font-bold text-slate-100 mt-1">{auditLogs.length}</h4>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">PII Disclosures (Unmasked)</p>
                  <h4 className="text-2xl font-bold text-emerald-400 mt-1">{piiExposedCount}</h4>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Unlock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Customer Records Inspected</p>
                  <h4 className="text-2xl font-bold text-purple-400 mt-1">{totalRecordsRead}</h4>
                </div>
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">PostgreSQL Audit Trail Log</h3>
                  <p className="text-xs text-slate-400">Immutable governance access ledger</p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search user or action..."
                      value={searchAudit}
                      onChange={(e) => setSearchAudit(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    onClick={fetchAuditLogs}
                    className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loadingAudit ? (
                  <div className="p-12 text-center text-slate-400 text-sm">Loading audit trail...</div>
                ) : filteredLogs.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-sm">No audit logs found.</div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                        <th className="py-3 px-4">Log ID</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Table Accessed</th>
                        <th className="py-3 px-4 text-right">Records</th>
                        <th className="py-3 px-4 text-center">PII State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {filteredLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400">#{log.log_id}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{log.timestamp?.substring(0, 19)}</td>
                          <td className="py-3 px-4 font-semibold text-slate-100">{log.username}</td>
                          <td className="py-3 px-4 font-medium text-slate-400">{log.role_name}</td>
                          <td className="py-3 px-4 font-mono text-blue-400">{log.action}</td>
                          <td className="py-3 px-4 text-slate-400">{log.table_accessed}</td>
                          <td className="py-3 px-4 text-right font-mono">{log.records_returned}</td>
                          <td className="py-3 px-4 text-center">
                            {log.pii_exposed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                                <Unlock className="w-3 h-3 text-emerald-400" /> Unmasked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800/60">
                                <Lock className="w-3 h-3 text-blue-400" /> Masked
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: UNMASKED GOLD DATA */}
        {activeTab === 'gold' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Gold Layer: Unmasked Customer Records</h3>
              <p className="text-xs text-slate-400">Tokens dynamically mapped from PostgreSQL pii_vault table</p>
            </div>

            <div className="overflow-x-auto">
              {loadingGold ? (
                <div className="p-12 text-center text-slate-400 text-sm">Resolving PII tokens from vault...</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                      <th className="py-3 px-4">Customer ID</th>
                      <th className="py-3 px-4 text-emerald-300">Unmasked Name (PII)</th>
                      <th className="py-3 px-4 text-emerald-300">Unmasked Email (PII)</th>
                      <th className="py-3 px-4">State</th>
                      <th className="py-3 px-4">Risk Segment</th>
                      <th className="py-3 px-4">Credit Score</th>
                      <th className="py-3 px-4 text-right">Balance ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {goldData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-blue-400">{row.customer_id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-100 bg-emerald-950/20">{row.unmasked_name}</td>
                        <td className="py-3 px-4 text-slate-300 bg-emerald-950/20">{row.unmasked_email}</td>
                        <td className="py-3 px-4">{row.state}</td>
                        <td className="py-3 px-4">{row.risk_segment}</td>
                        <td className="py-3 px-4 font-mono">{row.credit_score}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">${row.total_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
