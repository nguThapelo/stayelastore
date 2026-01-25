import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Agent } from '@/lib/models/Agent';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const agent = await Agent.findById(params.id);
    
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, amount, customerPhone } = body;

    if (!['cashin', 'cashout'].includes(type) || amount < 10 || !customerPhone) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid transaction data' 
      }, { status: 400 });
    }

    const commissionRate = agent.level === 'bronze' ? 0.02 : agent.level === 'silver' ? 0.035 : 0.04;
    const commission = amount * commissionRate;

    agent.balance += commission;
    agent.transactions += 1;

    // Tier upgrades
    if (agent.transactions === 50 && agent.level === 'bronze') {
      agent.level = 'silver';
    } else if (agent.transactions === 200 && agent.level === 'silver') {
      agent.level = 'gold';
    }

    await agent.save();

    return NextResponse.json({
      success: true,
      data: {
        type,
        amount: `R${amount.toFixed(2)}`,
        commission: `R${commission.toFixed(2)}`,
        commission_rate: `${(commissionRate * 100).toFixed(1)}%`,
        new_balance: `R${agent.balance.toFixed(2)}`,
        transactions: agent.transactions,
        level: agent.level.toUpperCase(),
      },
    });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json({ success: false, error: 'Transaction failed' }, { status: 500 });
  }
}
