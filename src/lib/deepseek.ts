import axios from 'axios';
import { Agent } from './types';

interface OllamaResponse {
  response: string;
}

export async function assessCreditScore(agent: Agent): Promise<number> {
  try {
    console.log(`🤖 Direct Ollama HTTP: ${agent.name} (${agent.location})`);
    
    const response = await axios.post<OllamaResponse>(
      'http://localhost:11434/api/generate',
      {
        model: 'deepseek-coder:6.7b',
        prompt: `SOUTH AFRICAN TOWNSHIP AGENT CREDIT SCORE (300-850 ONLY):

AGENT: ${agent.name}
LOCATION: ${agent.location}
TRANSACTIONS: ${agent.transactions}
BALANCE: R${agent.balance.toFixed(2)}
TIER: ${agent.level.toUpperCase()}

SCORING:
Soweto=550 | Joburg=650 | High txns=+150 | Gold tier=+100

RETURN ONLY NUMBER (300-850):`,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          num_predict: 10,
        }
      },
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const score = parseInt((response.data.response || '550').trim());
    const finalScore = Math.max(300, Math.min(850, score));
    
    console.log(`✅ Ollama HTTP score: ${finalScore}`);
    return finalScore;
    
  } catch (error: any) {
    console.error('❌ Ollama HTTP failed:', error.message);
    
    // Production fallback (no AI dependency)
    let score = 400;
    score += Math.min(200, agent.transactions * 3);
    score += Math.min(150, Math.floor(agent.balance / 50));
    score += agent.level === 'silver' ? 100 : agent.level === 'gold' ? 200 : 0;
    
    const finalScore = Math.min(850, Math.max(300, score));
    console.log(`✅ Fallback score: ${finalScore}`);
    return finalScore;
  }
}
