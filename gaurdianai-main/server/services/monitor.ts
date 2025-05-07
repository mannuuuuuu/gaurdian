import { storage } from '../storage';
import { blockchainService } from './blockchain.ts';
import { groqService } from './groq.ts';
import type { Contract, InsertAlert } from '@shared/schema';

class MonitorService {
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private analysisInterval: NodeJS.Timeout | null = null;
  
  async start(): Promise<boolean> {
    if (this.isRunning) return true;
    
    try {
      // Initialize blockchain connection
      const blockchainInit = await blockchainService.initialize();
      if (!blockchainInit) {
        console.error('Failed to initialize blockchain connection');
        return false;
      }
      
      // Initialize AI service
      const aiInit = await groqService.initialize();
      console.log(`AI service initialization: ${aiInit ? 'SUCCESS' : 'FAILED'}`);
      
      // Start monitoring cycle
      this.isRunning = true;
      
      // Schedule periodic security checks (every 30 minutes)
      this.checkInterval = setInterval(() => {
        this.runSecurityChecks().catch(err => {
          console.error('Error in security check cycle:', err);
        });
      }, 30 * 60 * 1000);
      
      // Schedule AI analysis cycle (every 2 hours)
      this.analysisInterval = setInterval(() => {
        this.runAIAnalysis().catch(err => {
          console.error('Error in AI analysis cycle:', err);
        });
      }, 2 * 60 * 60 * 1000);
      
      // Run the first check immediately
      await this.runSecurityChecks();
      
      console.log('Guardian AI monitoring service started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start monitoring service:', error);
      this.isRunning = false;
      return false;
    }
  }
  
  async stop(): Promise<void> {
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    console.log('Guardian AI monitoring service stopped');
  }
  
  private async runSecurityChecks(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('Running security checks on monitored contracts...');
    
    try {
      const contracts = await storage.getContracts();
      
      for (const contract of contracts) {
        await this.checkContractHealth(contract);
      }
      
      console.log('Security check cycle completed');
    } catch (error) {
      console.error('Error during security checks:', error);
    }
  }
  
  private async checkContractHealth(contract: Contract): Promise<void> {
    console.log(`Checking health of contract: ${contract.name}`);
    
    try {
      // Check if contract code is available
      const contractCode = await blockchainService.getContractCode(contract.address);
      
      if (!contractCode || contractCode === '0x') {
        // Contract doesn't exist or is self-destructed
        this.createAlert(contract, 'HIGH', 
          'Contract unavailable', 
          `The contract at ${contract.address} is unavailable or self-destructed.`);
        
        await storage.updateContractStatus(contract.id, 'ALERT');
        return;
      }
      
      // Check recent events for suspicious activity
      const recentEvents = await storage.getEventsByContract(contract.id, 10);
      
      // If no events, consider it healthy
      if (recentEvents.length === 0) {
        await storage.updateContractStatus(contract.id, 'HEALTHY');
        return;
      }
      
      // Check for suspicious patterns in events
      // This is a simplified example - real analysis would be more complex
      const suspiciousEventCount = recentEvents.filter(event => {
        // Example: Multiple BadgeClaim events in short period might be suspicious
        return event.eventName === 'BadgeClaim' || event.eventName === 'AlertSubmitted';
      }).length;
      
      if (suspiciousEventCount >= 3) {
        this.createAlert(contract, 'MEDIUM',
          'Unusual event pattern detected',
          `Multiple ${recentEvents[0].eventName} events detected in a short time period.`);
        
        await storage.updateContractStatus(contract.id, 'WARNING');
      }
    } catch (error) {
      console.error(`Error checking contract ${contract.name}:`, error);
      
      // Create an alert for the error
      this.createAlert(contract, 'LOW',
        'Error monitoring contract', 
        `Failed to monitor contract: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private async runAIAnalysis(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('Running AI analysis on contracts...');
    
    try {
      // Check if we're within the token usage limit
      const withinLimit = await groqService.isWithinUsageLimit();
      
      if (!withinLimit) {
        console.warn('AI analysis skipped: Token usage limit reached');
        return;
      }
      
      const contracts = await storage.getContracts();
      
      for (const contract of contracts) {
        await this.analyzeContractWithAI(contract);
      }
      
      console.log('AI analysis cycle completed');
    } catch (error) {
      console.error('Error during AI analysis:', error);
    }
  }
  
  private async analyzeContractWithAI(contract: Contract): Promise<void> {
    try {
      console.log(`Analyzing contract with AI: ${contract.name}`);
      
      // Get contract code
      const contractCode = await blockchainService.getContractCode(contract.address);
      
      if (!contractCode || contractCode === '0x') {
        console.warn(`Cannot analyze contract ${contract.name}: No code available`);
        return;
      }
      
      // Analyze with AI
      const { analysis, tokenCount } = await groqService.analyzeContract(contract, contractCode);
      
      // Parse the analysis for vulnerability indicators
      const vulnerabilityIndicators = [
        { pattern: /reentrancy/i, severity: 'HIGH', title: 'Reentrancy vulnerability' },
        { pattern: /access control/i, severity: 'HIGH', title: 'Access control issue' },
        { pattern: /overflow|underflow/i, severity: 'MEDIUM', title: 'Integer overflow/underflow' },
        { pattern: /front.?running/i, severity: 'MEDIUM', title: 'Front-running vulnerability' },
        { pattern: /logic error/i, severity: 'MEDIUM', title: 'Logic error' },
        { pattern: /gas optimization/i, severity: 'LOW', title: 'Gas optimization issue' }
      ];
      
      // Check for indicators in the analysis
      for (const { pattern, severity, title } of vulnerabilityIndicators) {
        if (pattern.test(analysis)) {
          this.createAlert(contract, severity, title, analysis);
          
          // Update contract status based on severity
          if (severity === 'HIGH') {
            await storage.updateContractStatus(contract.id, 'ALERT');
          } else if (severity === 'MEDIUM' && contract.status !== 'ALERT') {
            await storage.updateContractStatus(contract.id, 'WARNING');
          }
          
          // Only create one alert per analysis
          break;
        }
      }
    } catch (error) {
      console.error(`Error analyzing contract ${contract.name} with AI:`, error);
    }
  }
  
  private async createAlert(
    contract: Contract, 
    severity: string, 
    title: string, 
    description: string,
    aiAnalysis?: string
  ): Promise<void> {
    try {
      const alertData: InsertAlert = {
        contractId: contract.id,
        severity,
        title,
        description,
        aiAnalysis,
        resolved: false
      };
      
      await storage.createAlert(alertData);
      console.log(`Alert created for ${contract.name}: ${title}`);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }
  
  async analyzeEvent(contractId: number, eventId: number): Promise<void> {
    try {
      const contract = await storage.getContract(contractId);
      if (!contract) {
        console.error(`Cannot analyze event: Contract ID ${contractId} not found`);
        return;
      }
      
      // Get events for this contract
      const events = await storage.getEventsByContract(contractId);
      const event = events.find(e => e.id === eventId);
      
      if (!event) {
        console.error(`Event ID ${eventId} not found for contract ${contract.name}`);
        return;
      }
      
      console.log(`Analyzing event ${event.eventName} with AI...`);
      
      // Use AI to analyze the event
      const { analysis, tokenCount } = await groqService.analyzeEvent(
        contract, 
        event.eventName, 
        event.eventData
      );
      
      // Look for indications of issues in the analysis
      const hasSuspiciousActivity = /suspicious|unusual|vulnerability|attack|exploit/i.test(analysis);
      
      if (hasSuspiciousActivity) {
        const severity = /critical|severe|high risk/i.test(analysis) ? 'HIGH' :
                       /medium|moderate/i.test(analysis) ? 'MEDIUM' : 'LOW';
        
        this.createAlert(
          contract,
          severity,
          `Suspicious activity in ${event.eventName} event`,
          `AI detected potentially suspicious activity: ${analysis.slice(0, 200)}...`,
          analysis
        );
        
        // Update contract status based on severity
        if (severity === 'HIGH') {
          await storage.updateContractStatus(contract.id, 'ALERT');
        } else if (severity === 'MEDIUM' && contract.status !== 'ALERT') {
          await storage.updateContractStatus(contract.id, 'WARNING');
        }
      }
    } catch (error) {
      console.error('Error analyzing event with AI:', error);
    }
  }
  
  isActive(): boolean {
    return this.isRunning;
  }
  
  async scanContract(contractAddress: string): Promise<void> {
    try {
      // Find the contract
      const contract = await storage.getContractByAddress(contractAddress);
      
      if (!contract) {
        console.error(`Contract not found: ${contractAddress}`);
        return;
      }
      
      console.log(`Manual scan initiated for contract: ${contract.name}`);
      
      // Perform contract health check
      await this.checkContractHealth(contract);
      
      // Run AI analysis
      await this.analyzeContractWithAI(contract);
      
      console.log(`Manual scan completed for contract: ${contract.name}`);
    } catch (error) {
      console.error(`Error scanning contract ${contractAddress}:`, error);
    }
  }
}

export const monitorService = new MonitorService();
