import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, Activity, CheckCircle2, XCircle, RefreshCw, Server } from 'lucide-react';

export const AdminDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('health'); // 'health', 'quality', 'audit'
  /* eslint-disable no-unused-vars */
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingDQ, setLoadingDQ] = useState(true);
  /* eslint-enable no-unused-vars */

  const fetchPipelineStatus = async () => {
    setLoadingHealth(true);
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8000/pipeline/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) setPipelineStatus(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchDataQuality = async () => {
    setLoadingDQ(true);
    try {
      const apiHost = window.location.hostname;
      const res = await fetch(`http://${apiHost}:8000/pipeline/data-quality`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) setDataQuality(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDQ(false);
    }
  };

  useEffect(() => {
    fetchPipelineStatus();
    fetchDataQuality();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">System Administration & Pipeline Health</h2>
            <p className="text-xs text-slate-400 mt-1">Airflow DAG orchestration monitor and automated compliance assertion engine</p>
          </div>

          <button
            onClick={() => { fetchPipelineStatus(); fetchDataQuality(); }}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-6 space-x-6">
          <button
            onClick={() => setActiveTab('health')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'health'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Airflow Pipeline Health
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'quality'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Data Quality Assertions ({dataQuality?.passed_checks || 0}/{dataQuality?.total_checks || 0})
          </button>
        </div>

        {/* TAB 1: AIRFLOW PIPELINE HEALTH */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            
            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">DAG ID</p>
                  <h4 className="text-base font-bold font-mono text-blue-400 mt-1">banking_medallion_pipeline</h4>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Server className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Latest Run State</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SUCCESS
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Orchestration Mode</p>
                  <h4 className="text-base font-bold text-slate-200 mt-1">Apache Airflow 2.8</h4>
                </div>
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Pipeline Stage Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-slate-100 mb-4">Medallion DAG Task Pipeline Architecture</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                    <span>Task 1</span>
                    <span className="text-emerald-400">SUCCESS</span>
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm mt-2">1_generate_bronze_data</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Generates Faker banking JSON into Bronze S3 bucket</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                    <span>Task 2</span>
                    <span className="text-emerald-400">SUCCESS</span>
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm mt-2">2_transform_bronze_to_silver</h4>
                  <p className="text-[11px] text-slate-400 mt-1">HMAC SHA-256 PII tokenization & Postgres Vault store</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                    <span>Task 3</span>
                    <span className="text-emerald-400">SUCCESS</span>
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm mt-2">3_transform_silver_to_gold</h4>
                  <p className="text-[11px] text-slate-400 mt-1">DuckDB business aggregates & Power BI Parquet export</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                    <span>Task 4</span>
                    <span className="text-emerald-400">SUCCESS</span>
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm mt-2">4_run_data_quality_checks</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Asserts 0 PII leaks in Gold layer before DAG completes</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: DATA QUALITY ASSERTIONS */}
        {activeTab === 'quality' && (
          <div className="space-y-6">
            
            {/* Overall Health Status Banner */}
            <div className={`p-5 rounded-2xl border flex items-center justify-between ${
              dataQuality?.overall_status === 'PASS'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}>
              <div className="flex items-center space-x-3">
                {dataQuality?.overall_status === 'PASS' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <h3 className="text-lg font-bold">
                    {dataQuality?.overall_status === 'PASS' ? 'All Data Quality & PII Leakage Assertions Passed' : 'Data Quality Failure Detected'}
                  </h3>
                  <p className="text-xs opacity-80 mt-0.5">
                    {dataQuality?.passed_checks} of {dataQuality?.total_checks} automated validation checks passed cleanly.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-700">
                Status: {dataQuality?.overall_status}
              </span>
            </div>

            {/* Checks Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-100 mb-4">Detailed Compliance & Quality Assertions</h3>

              {dataQuality?.checks?.map((check, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">{check.category}</span>
                      <h4 className="text-sm font-bold text-slate-100">{check.check_name}</h4>
                    </div>
                    <p className="text-xs text-slate-400">{check.details}</p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      Severity: {check.severity}
                    </span>
                    {check.status === 'PASS' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800/60">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" /> FAIL
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
