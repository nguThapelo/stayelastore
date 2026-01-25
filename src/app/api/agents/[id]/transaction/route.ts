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
      return NextResponse.json({ 
        success: false, 
        error: 'Agent not found' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { type, amount, customerPhone } = body;

    if (!['cashin', 'cashout'].includes(type) || 
        typeof amount !== 'number' || amount < 10 || 
        !customerPhone) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid transaction (type: cashin/cashout, amount >= R10)' 
      }, { status: 400 });
    }

    const rates = { bronze: 0.02, silver: 0.035, gold: 0.04 };
    const commissionRate = rates[agent.level as keyof typeof rates];
    const commission = Math.round(amount * commissionRate * 100) / 100;

    agent.balance += commission;
    agent.transactions += 1;

    // Tier progression
    if (agent.transactions >= 50 && agent.level === 'bronze') {
      agent.level = 'silver';
    } else if (agent.transactions >= 200 && agent.level === 'silver') {
      agent.level = 'gold';
    }

    await agent.save();

    return NextResponse.json({
      success: true,
      data: {
        transaction_id: Date.now().toString(),
        type,
        amount: `R${amount.toFixed(2)}`,
        commission: `R${commission.toFixed(2)}`,
        rate: `${(commissionRate * 100).toFixed(1)}%`,
        new_balance: `R${agent.balance.toFixed(2)}`,
        transactions: agent.transactions,
        level: agent.level.toUpperCase(),
      },
    });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Transaction processing failed' 
    }, { status: 500 });
  }
}
