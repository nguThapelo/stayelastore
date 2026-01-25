'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ApiResponse } from '@/lib/types';

export default function AgencyBanking() {
  const [agentId, setAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);

  const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
  });

  const registerAgent = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    
    try {
      const res = await api.post('/agents/register', {
        phone: `082${Math.floor(Math.random() * 9000000 + 1000000)}`,
        name: `Soweto Spaza ${Date.now().toString().slice(-6)}`,
        location: 'Soweto',
      });
      
      setResponse(res.data);
      if (res.data.success) {
        setAgentId(res.data.data.agent_id);
      }
    } catch (error: any) {
      setResponse({
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      });
    } finally {
      setLoading(false);
    }
  }, [api]);

  const processCashIn = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    
    try {
      const res = await api.post(`/agents/${agentId}/transaction`, {
        type: 'cashin',
        amount: 5000,
        customerPhone: '0821234567',
      });
      
      setResponse(res.data);
    } catch (error: any) {
      setResponse({
        success: false,
        error: error.response?.data?.error || 'Transaction failed',
      });
    } finally {
      setLoading(false);
    }
  }, [agentId, api]);

  const issueLoan = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    
    try {
      const res = await api.post(`/agents/${agentId}/nano-loan`, {
        amount: 10000,
        customerPhone: '0821234567',
      });
      
      setResponse(res.data);
    } catch (error: any) {
      setResponse({
        success: false,
        error: error.response?.data?.error || 'Loan failed',
      });
    } finally {
      setLoading(false);
    }
  }, [agentId, api]);

  const refreshDashboard = useCallback(async () => {
    if (!agentId) return;
    
    try {
      const res = await api.get(`/agents/${agentId}/dashboard`);
      setDashboard(res.data.data);
    } catch (error) {
      console.error('Dashboard refresh failed');
    }
  }, [agentId, api]);

  useEffect(() => {
    if (agentId) {
      const interval = setInterval(refreshDashboard, 5000);
      return () => clearInterval(interval);
    }
  }, [agentId, refreshDashboard]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-600 p-12">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-20">
          <h1 className="text-7xl font-black bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent mb-6">
            🏦 Township Banking Agent
          </h1>
          <p className="text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            DeepSeek-Coder 6.7B • 100% Local AI • MongoDB • R200-500 Daily Commissions
          </p>
        </header>

        {/* Controls */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <button
            onClick={registerAgent}
            disabled={loading}
            className="group bg-emerald-500/90 hover:bg-emerald-600 text-white px-10 py-8 rounded-3xl font-bold text-xl shadow-2xl hover:shadow-emerald-500/25 transform hover:-translate-y-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="block group-hover:hidden">🧪 Register Agent</span>
            <span className="hidden group-hover:block">⏳ Processing...</span>
          </button>

          <button
            onClick={processCashIn}
            disabled={loading || !agentId}
            className="group bg-blue-500/90 hover:bg-blue-600 text-white px-10 py-8 rounded-3xl font-bold text-xl shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-2 transition-all duration-300 disabled:opacity-50"
          >
            💵 R5,000 Cash-In
          </button>

          <button
            onClick={issueLoan}
            disabled={loading || !agentId}
            className="group bg-purple-500/90 hover:bg-purple-600 text-white px-10 py-8 rounded-3xl font-bold text-xl shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-2 transition-all duration-300 disabled:opacity-50"
          >
            🤖 R10K AI Loan
          </button>

          <button
            onClick={refreshDashboard}
            disabled={loading || !agentId}
            className="group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-8 rounded-3xl font-bold text-xl shadow-2xl hover:shadow-orange-500/25 transform hover:-translate-y-2 transition-all duration-300 disabled:opacity-50"
          >
            📊 Live Dashboard
          </button>
        </div>

        {/* Agent ID */}
        {agentId && (
          <div className="mb-8 p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 text-center">
            <p className="text-lg text-white/90">Active Agent ID:</p>
            <code className="bg-white/20 px-4 py-2 rounded-2xl font-mono text-emerald-300 text-xl">
              {agentId.slice(-8)}
            </code>
          </div>
        )}

        {/* Latest Response */}
        {response && (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 mb-12">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              📋 Latest Operation
              <span className="ml-3 px-3 py-1 bg-emerald-500/20 text-emerald-200 rounded-full text-sm font-medium">
                {response.success ? 'SUCCESS' : 'ERROR'}
              </span>
            </h3>
            <pre className="text-xs overflow-auto max-h-80 p-6 bg-black/20 rounded-2xl font-mono">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {/* Live Dashboard */}
        {dashboard && (
          <div className="bg-gradient-to-br from-white/5 to-black/5 backdrop-blur-2xl rounded-3xl p-12 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-black text-white">
                {dashboard.name} • {dashboard.location}
              </h2>
              <div className="px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl text-emerald-200">
                {dashboard.level} TIER • {dashboard.kpi_status.toUpperCase()}
              </div>
            </div>

            <div className="grid lg:grid-cols-5 md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-4xl font-black text-emerald-400 mb-2">{dashboard.balance}</div>
                <div className="text-white/80 text-lg">Current Balance</div>
              </div>
              
              <div className="text-center p-8 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-4xl font-black text-blue-400 mb-2">{dashboard.transactions}</div>
                <div className="text-white/80 text-lg">Transactions</div>
              </div>
              
              <div className="text-center p-8 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-4xl font-black text-purple-400 mb-2">{dashboard.volume_30d}</div>
                <div className="text-white/80 text-lg">30D Volume</div>
              </div>
              
              <div className="text-center p-8 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-4xl font-black text-orange-400 mb-2">{dashboard.commission_rate}</div>
                <div className="text-white/80 text-lg">Commission</div>
              </div>
              
              <div className="text-center p-8 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all">
                <div className={`text-4xl font-black mb-2 ${dashboard.fraud_alert ? 'text-red-400' : 'text-green-400'}`}>
                  {dashboard.next_tier}
                </div>
                <div className="text-white/80 text-lg">Next Milestone</div>
              </div>
            </div>

            {dashboard.fraud_alert && (
              <div className="mt-12 p-8 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-400/50 rounded-3xl">
                <div className="text-2xl font-bold text-red-200 flex items-center">
                  ⚠️ {dashboard.fraud_alert}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
