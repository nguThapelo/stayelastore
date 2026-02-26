import { NextResponse } from 'next/server';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';
import { getOpenAIClient, parseModelJson } from '@/lib/openai';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { captureServerError } from '@/lib/sentry';
import { FieldValue } from 'firebase-admin/firestore';

const PRIME_RATE = 11.75;
const LOAN_RATE = PRIME_RATE + 3.5;

function monthlyRate(annualRate) {
  return annualRate / 100 / 12;
}

function monthlyPayment(principal, annualRate, months) {
  const r = monthlyRate(annualRate);
  if (!r) {
    return principal / months;
  }
  return (principal * r) / (1 - (1 + r) ** -months);
}

function estimateTax(annualTaxableIncome) {
  const brackets = [
    { upTo: 237100, rate: 0.18, base: 0, threshold: 0 },
    { upTo: 370500, rate: 0.26, base: 42678, threshold: 237100 },
    { upTo: 512800, rate: 0.31, base: 77362, threshold: 370500 },
    { upTo: 673000, rate: 0.36, base: 121475, threshold: 512800 },
    { upTo: 857900, rate: 0.39, base: 179147, threshold: 673000 },
    { upTo: 1817000, rate: 0.41, base: 251258, threshold: 857900 },
    { upTo: Infinity, rate: 0.45, base: 644489, threshold: 1817000 },
  ];

  const bracket = brackets.find((item) => annualTaxableIncome <= item.upTo);
  const tax = bracket.base + (annualTaxableIncome - bracket.threshold) * bracket.rate;
  return Math.max(0, tax);
}

function deterministicModel({ dailySales, weeklyTarget }) {
  const expenses = dailySales * 0.4;
  const profit = dailySales - expenses;
  const annualProfit = profit * 312;
  const annualTax = estimateTax(annualProfit);
  const sarsTaxEstimate = annualTax / 312;
  const targetRatio = Math.min(2, dailySales * 7 / weeklyTarget);
  const creditScore = Math.max(300, Math.min(850, Math.round(320 + targetRatio * 180 + profit * 0.9)));
  const loanAmount = Math.round(Math.min(85000, Math.max(5000, creditScore * 22)));
  const payment = monthlyPayment(loanAmount, LOAN_RATE, 12);
  const repaymentSchedule = [];
  let outstanding = loanAmount;

  for (let month = 1; month <= 12; month += 1) {
    const interest = outstanding * monthlyRate(LOAN_RATE);
    const principal = payment - interest;
    outstanding = Math.max(0, outstanding - principal);
    repaymentSchedule.push({
      month,
      payment: Number(payment.toFixed(2)),
      interestPortion: Number(interest.toFixed(2)),
      principalPortion: Number(principal.toFixed(2)),
      balanceAfterPayment: Number(outstanding.toFixed(2)),
    });
  }

  const dtiMonthlyLimit = profit * 0.3;
  const bondRate = PRIME_RATE + 0.75;
  const maxBond = Math.round((dtiMonthlyLimit * (1 - (1 + monthlyRate(bondRate)) ** -240)) / monthlyRate(bondRate));
  const carMaxMonthlyInstalment = profit * 0.25;
  const financedCarAmount = (carMaxMonthlyInstalment * (1 - (1 + monthlyRate(LOAN_RATE)) ** -60)) / monthlyRate(LOAN_RATE);
  const maxCarPrice = Math.round(financedCarAmount / 0.8);

  return {
    expenses: Number(expenses.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    sarsTaxEstimate: Number(sarsTaxEstimate.toFixed(2)),
    creditScore,
    loan: {
      amount: loanAmount,
      annualRate: LOAN_RATE,
      monthlyRepayment: Number(payment.toFixed(2)),
      repaymentSchedule,
    },
    carAffordability: {
      maxCarPrice,
      requiredDeposit: Number((maxCarPrice * 0.2).toFixed(2)),
      affordable: maxCarPrice > 30000,
    },
    bondQualification: {
      maxBond: Math.max(0, maxBond),
      monthlyDTILimit: Number(dtiMonthlyLimit.toFixed(2)),
      qualifies: maxBond >= 420000,
    },
    narrative:
      `Daily sales of R${dailySales} yields expenses of 40% and profit after costs. SARS tax was estimated using the 2026 progressive brackets. ` +
      `Credit score reflects sales consistency against weekly target. Loan uses prime+3.5% and bond qualification uses a 30% DTI limit.`,
    provider: 'deterministic-fallback',
  };
}

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = enforceRateLimit(`financial:${ip}`, 300, 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded (300 req/min).' }, { status: 429 });
  }

  try {
    const payload = await request.json();
    const dailySales = Number(payload.dailySales);
    const weeklyTarget = Number(payload.weeklyTarget);
    const agentId = payload.agentId;
    const today = new Date().toISOString().slice(0, 10);

    if (!dailySales || !weeklyTarget) {
      return NextResponse.json({ success: false, error: 'dailySales and weeklyTarget are required.' }, { status: 400 });
    }

    let result = deterministicModel({ dailySales, weeklyTarget });

    const openai = getOpenAIClient();
    if (openai) {
      const prompt = `South African township store owner. Daily sales: R${dailySales}, Weekly target: R${weeklyTarget}
ACTUAL 2026 SA rates:
- SARS tax: 18-45% progressive brackets
- Prime rate: 11.75%
- Credit scoring: TransUnion/Experian SA methodology
Calculate & explain:
1. Expenses (40% sales), profit
2. Real SARS tax estimate
3. SA credit score (300-850) with local factors
4. Loan amount @ prime+3.5%, repayment schedule
5. Car affordability (20% deposit)
6. Bond qualification (30% DTI ratio)
Return strict JSON with keys: expenses, profit, sarsTaxEstimate, creditScore, loan, carAffordability, bondQualification, narrative.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content:
              'You are a South African financial advisor for township entrepreneurs. Provide conservative, realistic numbers using ZAR.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const parsed = parseModelJson(completion.choices?.[0]?.message?.content);
      if (parsed && parsed.loan && parsed.bondQualification) {
        result = {
          ...result,
          ...parsed,
          provider: 'openai-gpt-4o-mini',
        };
      }
    }

    const firebase = getFirebaseAdmin();
    if (firebase.configured && agentId) {
      await firebase.db.collection('agents').doc(agentId).set(
        {
          weeklyTarget,
          cashFlow: Number((result.profit || 0).toFixed(2)),
          creditScore: Number(result.creditScore || 300),
          latestCalculationAt: new Date().toISOString(),
          latestCalculation: result,
          dailyEntries: FieldValue.arrayUnion({
            date: today,
            dailySales: Number(dailySales.toFixed(2)),
            profit: Number((result.profit || 0).toFixed(2)),
            tax: Number((result.sarsTaxEstimate || 0).toFixed(2)),
            creditScore: Number(result.creditScore || 300),
          }),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else if (!firebase.configured && agentId) {
      const localAgents = globalThis.__localAgents || [];
      const index = localAgents.findIndex((item) => item.id === agentId);
      if (index >= 0) {
        const existing = localAgents[index];
        const entries = Array.isArray(existing.dailyEntries) ? existing.dailyEntries : [];
        localAgents[index] = {
          ...existing,
          weeklyTarget,
          cashFlow: Number((result.profit || 0).toFixed(2)),
          creditScore: Number(result.creditScore || 300),
          latestCalculationAt: new Date().toISOString(),
          latestCalculation: result,
          dailyEntries: [
            ...entries,
            {
              date: today,
              dailySales: Number(dailySales.toFixed(2)),
              profit: Number((result.profit || 0).toFixed(2)),
              tax: Number((result.sarsTaxEstimate || 0).toFixed(2)),
              creditScore: Number(result.creditScore || 300),
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    captureServerError(error, { route: '/api/financial-advisor' });
    return NextResponse.json({ success: false, error: 'Financial advisor request failed.' }, { status: 500 });
  }
}