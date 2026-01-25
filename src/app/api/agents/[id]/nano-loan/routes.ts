import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Agent } from '@/lib/models/Agent';
import { assessCreditScore } from '@/lib/deepseek';

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
    const { amount, customerPhone } = body;

    if (amount < 100 || amount > 50000 || !customerPhone) {
      return NextResponse.json({ 
        success: false, 
        error: 'Loan amount must be R100-R50,000' 
      }, { status: 400 });
    }

    // DeepSeek AI Credit Scoring
    const creditScore = await assessCreditScore(agent);
    const maxLoan = Math.min(50000, creditScore * 0.06); // Conservative multiplier

    if (amount > maxLoan) {
      return NextResponse.json({
        success: false,
        error: `Loan exceeds limit R${maxLoan.toFixed(0)} (Credit Score: ${creditScore})`,
      }, { status: 400 });
    }

    // Agent earns 3% loan origination fee
    const loanFee = amount * 0.03;
    agent.balance += loanFee;
    agent.transactions += 1;
    await agent.save();

    return NextResponse.json({
      success: true,
      data: {
        loan_id: `LN${Date.now()}`,
        principal: `R${amount.toFixed(2)}`,
        credit_score: creditScore,
        ai_model: 'DeepSeek-Coder 6.7B Local',
        agent_fee: `R${loanFee.toFixed(2)}`,
        total_repayment: `R${(amount * 1.1).toFixed(2)}`,
        repayment_terms: '30 days',
        status: 'approved',
      },
    });
  } catch (error) {
    console.error('Loan error:', error);
    return NextResponse.json({ success: false, error: 'Loan processing failed' }, { status: 500 });
  }
}
