import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Agent } from '@/lib/models/Agent';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const agent = await Agent.findById(params.id).lean();
    
    if (!agent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Agent not found' 
      }, { status: 404 });
    }

    const avgTxnValue = 85; // R85 township average
    const volumeEstimate = agent.transactions * avgTxnValue;
    const highRisk = agent.transactions > 150 || agent.balance > 30000;
    const tierProgress = agent.transactions < 50 ? 50 - agent.transactions : 200 - agent.transactions;

    return NextResponse.json({
      success: true,
      data: {
        agent_id: agent._id,
        name: agent.name,
        phone: agent.phone.slice(-8), // Last 8 digits
        location: agent.location,
        level: agent.level.toUpperCase(),
        balance: `R${agent.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
        transactions: agent.transactions,
        volume_30d: `R${volumeEstimate.toLocaleString('en-ZA')}`,
        commission_rate: agent.level === 'bronze' ? '2%' : agent.level === 'silver' ? '3.5%' : '4%',
        tier_progress: `${tierProgress} txns to next tier`,
        fraud_alert: highRisk ? '⚠️ MANUAL REVIEW REQUIRED' : '✅ NORMAL',
        performance: agent.transactions >= 50 ? 'EXCELLENT' : 'GROWING',
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Dashboard unavailable' 
    }, { status: 500 });
  }
}
