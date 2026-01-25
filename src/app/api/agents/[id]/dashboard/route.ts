import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Agent } from '@/lib/models/Agent';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const agent = await Agent.findById(params.id).lean() as any;
    
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const avgTransactionValue = 75; // R75 average township transaction
    const estimatedVolume = agent.transactions * avgTransactionValue;
    const fraudRisk = agent.transactions > 150 || agent.balance > 25000;

    return NextResponse.json({
      success: true,
      data: {
        agent_id: agent._id.toString(),
        name: agent.name,
        location: agent.location,
        phone: agent.phone,
        level: agent.level.toUpperCase(),
        balance: `R${agent.balance.toFixed(2)}`,
        transactions: agent.transactions,
        volume_30d: `R${estimatedVolume.toFixed(0)}`,
        commission_rate: agent.level === 'bronze' ? '2%' : agent.level === 'silver' ? '3.5%' : '4%',
        next_tier: agent.transactions < 50 ? 50 : agent.transactions < 200 ? 200 : 'MAXED',
        fraud_alert: fraudRisk ? '⚠️ High activity detected - review required' : '✅ Normal',
        kpi_status: agent.transactions >= 50 ? 'excellent' : 'growing',
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Dashboard unavailable' }, { status: 500 });
  }
}
