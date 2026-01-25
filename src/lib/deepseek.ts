import { ollama } from 'ollama-ai-provider';
import { generateText } from 'ai';
import { Agent } from './types';

export async function assessCreditScore(agent: Agent): Promise<number> {
  try {
    console.log('🤖 DeepSeek AI analyzing agent:', agent.name);
    
    const { text } = await generateText({
      model: ollama('deepseek-coder:6.7b'),
      prompt: `CREDIT SCORING for South African township banking agent (RETURN ONLY NUMBER 300-850):

AGENT: ${agent.name}
LOCATION: ${agent.location} (Soweto=650, Joburg CBD=750, Sandton=850)
TRANSACTIONS: ${agent.transactions} (${agent.transactions > 50 ? 'High' : 'Low'})
BALANCE: R${agent.balance.toFixed(2)}
TIER: ${agent.level.toUpperCase()}

SCORING LOGIC:
- Bronze + <10 txns = 300-450
- Silver + Soweto = 500-650  
- Gold + High balance = 700-850

Return ONLY the score number:`,
      maxTokens: 4,
      temperature: 0.1,
    });

    const score = parseInt((text || '500').trim());
    const finalScore = Math.max(300, Math.min(850, score));
    
    console.log(`✅ DeepSeek score: ${score} → ${finalScore}`);
    return finalScore;
    
  } catch (error) {
    console.error('err:', error);
    
    // Smart fallback scoring (production-ready)
    let score = 300;
    if (agent.transactions >= 50) score += 200;
    if (agent.balance > 5000) score += 150;
    if (agent.level === 'silver') score += 100;
    if (agent.location.includes('Sandton')) score += 100;
    
    return Math.min(850, score);
  }
}
