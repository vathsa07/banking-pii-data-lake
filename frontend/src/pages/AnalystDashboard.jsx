import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, EyeOff, Lock, Users, DollarSign, CreditCard, Search, RefreshCw } from 'lucide-react';

export const AnalystDashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8000/data/gold`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        setData(result.data || []);
      } else {
        throw new Error(result.detail || 'Failed to load Gold data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const filteredData = data.filter(item => 
    item.customer_id?.toLowerCase().includes(search.toLowerCase()) ||
    item.state?.toLowerCase().includes(search.toLowerCase()) ||
    item.risk_segment?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = data.reduce((sum, item) => sum + (item.total_balance || 0), 0);
  const totalSpent = data.reduce((sum, item) => sum + (item.total_spent || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Alert for PII Protection */}
        <div className="mb-6 p-4 rounded-xl bg-blue-950/60 border border-blue-800/50 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-200">Data Protection Policy Active (GDPR Article 32)</h3>
            <p className="text-xs text-blue-300/80 mt-0.5">
              You are logged in as a <strong>Data Analyst</strong>. All Personally Identifiable Information (PII) including Name and Email are deterministically tokenized via HMAC-SHA256 to prevent unauthorized identity exposure.
            </p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Customers</p>
              <h4 className="text-2xl font-bold text-slate-100 mt-1">{data.length}</h4>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Aggregate Balance</p>
              <h4 className="text-2xl font-bold text-emerald-400 mt-1">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Customer Spent</p>
              <h4 className="text-2xl font-bold text-purple-400 mt-1">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Gold Customer Table Header & Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Gold Layer: Customer Analytics Summary</h2>
              <p className="text-xs text-slate-400">Business-ready aggregates with HMAC-tokenized PII</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter state or risk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={fetchData}
                className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-xl transition-colors"
                title="Refresh Table"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                <p>Loading Gold Layer datasets...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-rose-400 text-sm">
                <p>{error}</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No customer records match your query.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Customer ID</th>
                    <th className="py-3.5 px-4">Masked Name (PII Token)</th>
                    <th className="py-3.5 px-4">Masked Email (PII Token)</th>
                    <th className="py-3.5 px-4">State</th>
                    <th className="py-3.5 px-4">Risk Segment</th>
                    <th className="py-3.5 px-4">Credit Score</th>
                    <th className="py-3.5 px-4 text-right">Accounts</th>
                    <th className="py-3.5 px-4 text-right">Total Balance ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-blue-400">{row.customer_id}</td>
                      
                      {/* Styled Masked Name Badge */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800/40 select-all">
                          <EyeOff className="w-3 h-3 text-blue-400 shrink-0" />
                          {row.masked_name}
                        </span>
                      </td>

                      {/* Styled Masked Email Badge */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-950 text-slate-400 border border-slate-800 select-all">
                          <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                          {row.masked_email}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-300">{row.state}</td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          row.risk_segment === 'PEP (Politically Exposed)' ? 'bg-rose-950 text-rose-300 border border-rose-800/60' :
                          row.risk_segment === 'High Risk' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                          row.risk_segment === 'Medium Risk' ? 'bg-blue-950 text-blue-300 border border-blue-800/60' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        }`}>
                          {row.risk_segment}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium">{row.credit_score}</td>
                      <td className="py-3 px-4 text-right font-mono">{row.total_accounts}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                        ${row.total_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};
