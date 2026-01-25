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
      return NextResponse.json({ 
        success: false, 
        error: 'Agent not found' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { amount, customerPhone } = body;

    if (!customerPhone || typeof amount !== 'number' || amount < 100 || amount > 50000) {
      return NextResponse.json({ 
        success: false, 
        error: 'Loan: R100-R50,000, valid customer phone required' 
      }, { status: 400 });
    }

    //  AI Credit Assessment
    console.log(`🤖 AI Loan request: R${amount} by ${agent.name}`);
    const creditScore = await assessCreditScore(agent);
    const maxLoanLimit = Math.floor(creditScore * 0.06); // Conservative 6% of score
    const finalMaxLoan = Math.min(50000, maxLoanLimit);

    if (amount > finalMaxLoan) {
      return NextResponse.json({
        success: false,
        error: `Loan limit exceeded. Max: R${finalMaxLoan.toLocaleString()} (Score: ${creditScore})`,
      }, { status: 400 });
    }

    // Agent commission (3% origination fee)
    const originationFee = Math.round(amount * 0.03 * 100) / 100;
    agent.balance += originationFee;
    agent.transactions += 1;
    await agent.save();

    return NextResponse.json({
      success: true,
      data: {
        loan_id: `LN${Date.now()}`,
        principal: `R${amount.toLocaleString()}`,
        interest_rate: '10%',
        total_repayable: `R${(amount * 1.1).toLocaleString()}`,
        credit_score: creditScore,
        ai_model: 'DeepSeek-Coder-6.7B',
        agent_fee: `R${originationFee.toFixed(2)}`,
        terms: '30 days',
        status: 'approved',
        disbursed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Nano-loan error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Loan processing failed' 
    }, { status: 500 });
  }
}
