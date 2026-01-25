'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function AgencyBankingDashboard() {
  const [agentId, setAgentId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'connected' | 'error'>('idle');

  const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.head('/agents/register');
        setStatus('connected');
      } catch {
        setStatus('error');
      }
    };
    checkHealth();
  }, []);

  const registerAgent = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    
    try {
      const res = await api.post('/agents/register', {
        phone: `082${Math.floor(Math.random() * 9000000 + 1000000)}`,
        name: `Soweto Spaza ${Date.now().toString().slice(-6)}`,
        location: ['Soweto', 'Alexandra', 'Cosmo', 'Tembisa'][Math.floor(Math.random() * 4)],
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
    if (!agentId) return alert('Register agent first');
    setLoading(true);
    
    try {
      const res = await api.post(`/agents/${agentId}/transaction`, {
        type: 'cashin',
        amount: 5000,
        customerPhone: `082${Math.floor(Math.random() * 9000000 + 1000000)}`,
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
    if (!agentId) return alert('Register agent first');
    setLoading(true);
    
    try {
      const res = await api.post(`/agents/${agentId}/nano-loan`, {
        amount: 15000,
        customerPhone: `082${Math.floor(Math.random() * 9000000 + 1000000)}`,
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
      refreshDashboard();
      const interval = setInterval(refreshDashboard, 3000);
      return () => clearInterval(interval);
    }
  }, [agentId, refreshDashboard]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #15803d 100%)', overflow: 'hidden' }}>
      {/* Status Bar */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 50,
        padding: '1rem',
        borderRadius: '16px',
        fontWeight: 'bold',
        fontSize: '14px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        background: status === 'connected' ? '#10b981' : status === 'error' ? '#ef4444' : '#6b7280',
        color: 'white',
        backdropFilter: 'blur(20px)',
      }}>
        {status === 'connected' ? '🟢 LIVE - Agent Ready' : status === 'error' ? '🔴 Services Offline' : '⚪ Initializing...'}
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '2rem',
            textShadow: '0 0 30px rgba(255,255,255,0.5)'
          }}>
            🏦 Township Banking
          </h1>
          <p style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            marginBottom: '3rem',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto',
            opacity: 0.9,
            lineHeight: 1.6
          }}>
            Bank • 100% Local • R200-500 Daily Commissions → Nationwide
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '5rem'
        }}>
          <button
            onClick={registerAgent}
            // disabled={loading || status !== 'connected'}
            style={{
              padding: '1.5rem 2rem',
              border: 'none',
              borderRadius: '24px',
              fontWeight: 700,
              fontSize: '1.25rem',
              cursor: loading || status !== 'connected' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '80px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              boxShadow: '0 20px 40px rgba(16, 185, 129, 0.4)',
              opacity: loading || status !== 'connected' ? 0.5 : 1,
              transform: loading || status !== 'connected' ? 'none' : 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              if (!loading && status === 'connected') {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 30px 60px rgba(16, 185, 129, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.4)';
            }}
          >
            {loading ? '⏳ Processing...' : '🧪 Register Agent'}
          </button>

          <button
            onClick={processCashIn}
            // disabled={loading || !agentId || status !== 'connected'}
            style={{
              padding: '1.5rem 2rem',
              border: 'none',
              borderRadius: '24px',
              fontWeight: 700,
              fontSize: '1.25rem',
              cursor: loading || !agentId || status !== 'connected' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '80px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)',
              opacity: loading || !agentId || status !== 'connected' ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && agentId && status === 'connected') {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 30px 60px rgba(59, 130, 246, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.4)';
            }}
          >
            💵 R5,000 Cash-In
          </button>

          <button
            onClick={issueLoan}
            // disabled={loading || !agentId || status !== 'connected'}
            style={{
              padding: '1.5rem 2rem',
              border: 'none',
              borderRadius: '24px',
              fontWeight: 700,
              fontSize: '1.25rem',
              cursor: loading || !agentId || status !== 'connected' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '80px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: 'white',
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)',
              opacity: loading || !agentId || status !== 'connected' ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && agentId && status === 'connected') {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 30px 60px rgba(139, 92, 246, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.4)';
            }}
          >
            🤖 R15K AI Loan
          </button>

          <div style={{
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {agentId ? agentId.slice(-8) : '--'}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.75 }}>Active Agent</div>
          </div>
        </div>

        {/* Latest Response */}
        {response && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '2.5rem',
            marginBottom: '3rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                📋 Latest Operation
                <span style={{
                  marginLeft: '1rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '16px',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: 'white',
                  background: response.success ? '#10b981' : '#ef4444'
                }}>
                  {response.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </h3>
              <button
                onClick={() => setResponse(null)}
                style={{ fontSize: '1.5rem', opacity: 0.7, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <pre style={{
              overflow: 'auto',
              maxHeight: '24rem',
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              color: '#e5e7eb'
            }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {/* Live Dashboard */}
        {dashboard && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '32px',
            padding: '3rem',
            boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '3rem'
            }} className="lg:flex-row lg:items-center">
              <div>
                <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '900', marginBottom: '0.5rem' }}>
                  {dashboard.name}
                </h2>
                <p style={{ fontSize: '1.5rem', opacity: 0.8 }}>{dashboard.location} Branch</p>
              </div>
              <div style={{
                padding: '1rem 1.5rem',
                background: dashboard.level === 'GOLD' ? '#facc15' : dashboard.level === 'SILVER' ? '#10b981' : '#6b7280',
                borderRadius: '24px',
                color: dashboard.level === 'GOLD' ? '#000' : '#fff',
                fontWeight: 'bold',
                fontSize: '1.125rem'
              }}>
                {dashboard.level} TIER
              </div>
            </div>

            {/* KPI Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem'
            }}>
              <div style={{
                padding: '2rem',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.4)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#10b981', marginBottom: '1rem' }}>
                  {dashboard.balance}
                </div>
                <div style={{ opacity: 0.8, fontSize: '1.125rem' }}>Available Balance</div>
              </div>

              <div style={{
                padding: '2rem',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.4)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#3b82f6', marginBottom: '1rem' }}>
                  {dashboard.transactions?.toLocaleString?.()}
                </div>
                <div style={{ opacity: 0.8, fontSize: '1.125rem' }}>Transactions</div>
              </div>

              <div style={{
                padding: '2rem',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#8b5cf6', marginBottom: '1rem' }}>
                  {dashboard.volume_30d || 'R0'}
                </div>
                <div style={{ opacity: 0.8, fontSize: '1.125rem' }}>30D Volume</div>
              </div>

              <div style={{
                padding: '2rem',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(251, 191, 36, 0.4)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fbbc04', marginBottom: '1rem' }}>
                  {dashboard.commission_rate || '2%'}
                </div>
                <div style={{ opacity: 0.8, fontSize: '1.125rem' }}>Commission Rate</div>
              </div>

              <div style={{
                padding: '2rem',
                background: dashboard.fraud_alert?.includes?.('⚠️') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${dashboard.fraud_alert?.includes?.('⚠️') ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                borderRadius: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = dashboard.fraud_alert?.includes?.('⚠️') 
                  ? '0 0 30px rgba(239, 68, 68, 0.4)' 
                  : '0 0 30px rgba(16, 185, 129, 0.4)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '900', 
                  marginBottom: '1rem',
                  color: dashboard.fraud_alert?.includes?.('⚠️') ? '#ef4444' : '#10b981'
                }}>
                  {dashboard.tier_progress || 'MAXED'}
                </div>
                <div style={{ opacity: 0.8, fontSize: '1.125rem' }}>Next Milestone</div>
              </div>
            </div>

            {dashboard.fraud_alert?.includes?.('⚠️') && (
              <div style={{
                marginTop: '3rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(251, 191, 36, 0.2))',
                border: '2px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '24px',
                animation: 'pulse 2s infinite'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  🚨 {dashboard.fraud_alert}
                  <span style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    borderRadius: '16px',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>URGENT REVIEW</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: -1
      }}>
        <div style={{
          position: 'absolute',
          top: '-10rem',
          right: '-10rem',
          width: '20rem',
          height: '20rem',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 4s infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10rem',
          left: '-10rem',
          width: '20rem',
          height: '20rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 4s infinite 2s'
        }} />
      </div>
    </div>
  );
}
