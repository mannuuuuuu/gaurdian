import { storage } from '../storage';
import type { Contract, InsertAiQuery } from '@shared/schema';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'llama3-8b-8192';
const DAILY_TOKEN_LIMIT = 100000; // Example token limit for daily usage

class GroqService {
  private baseUrl: string = 'https://api.groq.com/openai/v1/chat/completions';
  private headers: HeadersInit;
  
  constructor() {
    if (!GROQ_API_KEY) {
      console.warn('GROQ_API_KEY is not set. AI analysis will be unavailable.');
    }
    
    this.headers = {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    };
  }
  
  async initialize(): Promise<boolean> {
    if (!GROQ_API_KEY) return false;
    
    try {
      // Test the API with a simple query
      const testResult = await this.query('Hello, are you working?');
      return !!testResult;
    } catch (error) {
      console.error('Failed to initialize Groq AI service:', error);
      return false;
    }
  }
  
  async query(prompt: string): Promise<string | null> {
    if (!GROQ_API_KEY) return null;
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: 'You are an expert blockchain security analyzer specializing in smart contract vulnerabilities. Provide clear, concise analysis of potential security issues.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${error}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const tokenCount = data.usage?.total_tokens || 0;
      
      return content;
    } catch (error) {
      console.error('Error querying Groq AI:', error);
      return null;
    }
  }
  
  async analyzeContract(contract: Contract, code: string): Promise<{analysis: string, tokenCount: number}> {
    if (!GROQ_API_KEY) {
      return { analysis: 'AI analysis unavailable: API key not configured', tokenCount: 0 };
    }
    
    // Create an appropriate prompt for contract analysis
    const prompt = `
      Analyze the following smart contract for security vulnerabilities:
      
      Contract Name: ${contract.name}
      Contract Address: ${contract.address}
      Contract Type: ${contract.type}
      
      Contract Code:
      ${code.slice(0, 8000)} ${code.length > 8000 ? '...(truncated)' : ''}
      
      Specifically look for:
      1. Reentrancy vulnerabilities
      2. Access control issues
      3. Integer overflow/underflow
      4. Logic errors
      5. Gas optimization issues
      6. Front-running vulnerabilities
      
      Provide a detailed analysis with security rating and recommendations.
    `;
    
    try {
      // Make the API call to Groq
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: 'You are an expert blockchain security analyzer specializing in smart contract vulnerabilities. Provide clear, concise analysis of potential security issues.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${error}`);
      }
      
      const data = await response.json();
      const analysis = data.choices[0]?.message?.content || '';
      const tokenCount = data.usage?.total_tokens || 0;
      
      // Store the AI query in the database
      const aiQueryData: InsertAiQuery = {
        contractId: contract.id,
        query: prompt,
        response: analysis,
        tokenCount
      };
      
      await storage.createAiQuery(aiQueryData);
      
      return { analysis, tokenCount };
    } catch (error) {
      console.error('Error analyzing contract with Groq AI:', error);
      return { 
        analysis: `Error analyzing contract: ${error instanceof Error ? error.message : String(error)}`, 
        tokenCount: 0 
      };
    }
  }
  
  async analyzeEvent(contract: Contract, eventName: string, eventData: any): Promise<{analysis: string, tokenCount: number}> {
    if (!GROQ_API_KEY) {
      return { analysis: 'AI analysis unavailable: API key not configured', tokenCount: 0 };
    }
    
    // Create a prompt for event analysis
    const prompt = `
      Analyze the following blockchain event:
      
      Contract: ${contract.name} (${contract.address})
      Event: ${eventName}
      Event Data: ${JSON.stringify(eventData, null, 2)}
      
      Is this event suspicious or unusual in any way?
      Does it indicate a potential security issue?
      What actions might be recommended based on this event?
      
      Provide a concise analysis.
    `;
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: 'You are an expert blockchain security analyzer specializing in smart contract vulnerabilities. Provide clear, concise analysis of potential security issues.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${error}`);
      }
      
      const data = await response.json();
      const analysis = data.choices[0]?.message?.content || '';
      const tokenCount = data.usage?.total_tokens || 0;
      
      // Store the AI query
      const aiQueryData: InsertAiQuery = {
        contractId: contract.id,
        query: prompt,
        response: analysis,
        tokenCount
      };
      
      await storage.createAiQuery(aiQueryData);
      
      return { analysis, tokenCount };
    } catch (error) {
      console.error('Error analyzing event with Groq AI:', error);
      return { 
        analysis: `Error analyzing event: ${error instanceof Error ? error.message : String(error)}`, 
        tokenCount: 0 
      };
    }
  }
  
  async isWithinUsageLimit(): Promise<boolean> {
    try {
      const totalTokens = await storage.getTotalQueryTokenCount();
      return totalTokens < DAILY_TOKEN_LIMIT;
    } catch (error) {
      console.error('Error checking token usage:', error);
      return false;
    }
  }
  
  async getTokenUsage(): Promise<{ used: number, limit: number, percentage: number }> {
    try {
      const totalTokens = await storage.getTotalQueryTokenCount();
      const percentage = (totalTokens / DAILY_TOKEN_LIMIT) * 100;
      
      return {
        used: totalTokens,
        limit: DAILY_TOKEN_LIMIT,
        percentage
      };
    } catch (error) {
      console.error('Error getting token usage:', error);
      return { used: 0, limit: DAILY_TOKEN_LIMIT, percentage: 0 };
    }
  }
}

export const groqService = new GroqService();
