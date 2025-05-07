import { ethers } from 'ethers';
import { storage } from '../storage';
import type { Contract, InsertEvent } from '@shared/schema';

// RPC URL from environment variables
const RPC_URL = process.env.RPC_URL || 'https://rpc.scs.soneium.io';
const DEMO_MODE = process.env.DEMO_MODE === 'true' || true; // Default to demo mode for now

// Guardian contract ABIs
const FEED_ABI = [
  "event AlertSubmitted(address indexed submitter, uint256 indexed alertId, string description)",
  "event AlertResolved(uint256 indexed alertId, address indexed resolver)"
];

const DAO_ABI = [
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description)",
  "event Vote(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)",
  "event ProposalExecuted(uint256 indexed proposalId)"
];

const BADGE_ABI = [
  "event BadgeClaim(address indexed claimer, uint256 indexed tokenId)",
  "event BadgeRevoked(uint256 indexed tokenId, address indexed revoker, string reason)"
];

// Demo mode implementation
class BlockchainService {
  private provider: ethers.JsonRpcProvider | null;
  private contracts: Map<string, any>;
  private listeners: Map<string, any>;
  private demoMode: boolean;

  constructor() {
    this.demoMode = DEMO_MODE;
    this.contracts = new Map();
    this.listeners = new Map();
    
    // Only create a real provider if not in demo mode
    if (!this.demoMode) {
      try {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
      } catch (error) {
        console.error('Error creating provider:', error);
        this.provider = null;
      }
    } else {
      this.provider = null;
      console.log('⚠️ Running in DEMO mode - No blockchain connection will be established');
    }
  }

  async initialize() {
    if (this.demoMode) {
      console.log('🔮 Guardian AI initialized in demo mode');
      
      // Initialize contracts from storage without real blockchain
      const contracts = await storage.getContracts();
      
      // Create demo data
      await this.createDemoEvents(contracts);
      await this.createDemoAlerts();
      
      return true;
    }
    
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }
      
      // Test connection
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`Connected to Soneium blockchain, current block: ${blockNumber}`);
      
      // Initialize contracts from storage
      const contracts = await storage.getContracts();
      for (const contract of contracts) {
        this.initializeContract(contract);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      console.log('⚠️ Switching to DEMO mode due to connection failure');
      this.demoMode = true;
      
      // Initialize in demo mode instead
      const contracts = await storage.getContracts();
      await this.createDemoEvents(contracts);
      await this.createDemoAlerts();
      
      return true;
    }
  }
  
  // Demo mode function to create sample events
  private async createDemoEvents(contracts: Contract[]) {
    const now = new Date();
    
    // Create one event for each contract
    for (const contract of contracts) {
      type EventTypes = {
        [key: string]: { 
          name: string; 
          data: Record<string, string>; 
        }
      };
      
      const eventTypes: EventTypes = {
        'FEED': { 
          name: 'AlertSubmitted', 
          data: { 
            submitter: '0x7834CbA335D49B6160cB7ad17f17A6ec38a18f32', 
            alertId: '123', 
            description: 'Suspicious activity detected in token transfer functions' 
          }
        },
        'DAO': { 
          name: 'ProposalCreated', 
          data: { 
            proposalId: '7', 
            proposer: '0x1A78be26D8373eDb66A71dd38dB196f7B9621C0F', 
            description: 'Proposal to update Guardian security parameters' 
          }
        },
        'BADGE': { 
          name: 'BadgeClaim', 
          data: { 
            claimer: '0x9B45dc3F0F271E1B1538189D6FD49A033c58De39', 
            tokenId: '42' 
          }
        }
      };
      
      const eventType = contract.type.toUpperCase();
      if (eventType in eventTypes) {
        const { name, data } = eventTypes[eventType];
        
        const timestamp = new Date(now);
        timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 60));
        
        const eventData: InsertEvent = {
          contractId: contract.id,
          eventName: name,
          blockNumber: 12345678,
          transactionHash: `0x${Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')}`,
          eventData: data
        };
        
        await storage.createEvent(eventData);
        console.log(`🔮 Created demo event ${name} for contract ${contract.name}`);
      }
    }
    
    console.log('🔮 Demo events created successfully');
  }
  
  private getContractAbi(type: string) {
    switch (type.toUpperCase()) {
      case 'FEED':
        return FEED_ABI;
      case 'DAO':
        return DAO_ABI;
      case 'BADGE':
        return BADGE_ABI;
      default:
        return [];
    }
  }

  private initializeContract(contract: Contract) {
    const { address, type, abi } = contract;
    
    try {
      // Use provided ABI or default based on contract type
      const contractAbi = abi || this.getContractAbi(type);
      
      // Type safety check
      if (!Array.isArray(contractAbi) || contractAbi.length === 0) {
        console.warn(`No ABI available for contract ${contract.name}`);
        return false;
      }
      
      // Create a contract instance
      const ethersContract = new ethers.Contract(address, contractAbi, this.provider);
      this.contracts.set(address, ethersContract);
      
      console.log(`Initialized contract: ${contract.name} (${address})`);
      
      // Start listening to events
      this.setupEventListeners(contract, ethersContract);
      
      return true;
    } catch (error) {
      console.error(`Error initializing contract ${contract.name}:`, error);
      return false;
    }
  }
  
  private async setupEventListeners(contract: Contract, ethersContract: ethers.Contract) {
    // Listen for all events defined in the ABI
    ethersContract.removeAllListeners();
    
    // For each event in the ABI
    for (const fragment of ethersContract.interface.fragments) {
      if (fragment.type !== 'event') continue;
      
      // Type assertion for fragment
      interface EventFragment {
        type: string;
        name: string;
      }
      
      // Use unknown as intermediate type for safe casting
      const eventFragment = fragment as unknown as EventFragment;
      const eventName = eventFragment.name;
      
      ethersContract.on(eventName, async (...args) => {
        // The last argument contains the event object with info like transaction hash
        const eventObj = args[args.length - 1];
        
        // Extract useful info
        const { blockNumber, transactionHash, args: eventArgs } = eventObj;
        
        console.log(`Event detected: ${eventName} on contract ${contract.name}`);
        
        // Store event in database
        try {
          const eventData: InsertEvent = {
            contractId: contract.id,
            eventName,
            blockNumber,
            transactionHash,
            eventData: this.formatEventArgs(eventArgs)
          };
          
          await storage.createEvent(eventData);
        } catch (error) {
          console.error(`Error storing event ${eventName}:`, error);
        }
      });
    }
    
    // Store in the listeners map
    this.listeners.set(contract.address, ethersContract);
    console.log(`Event listeners set up for contract: ${contract.name}`);
  }
  
  private formatEventArgs(args: any): Record<string, any> {
    // Convert BigInt to strings to make it JSON serializable
    const formatted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(args)) {
      // Skip numeric keys (args are both indexed by position and name)
      if (!isNaN(Number(key))) continue;
      
      formatted[key] = typeof value === 'bigint' 
        ? value.toString() 
        : value;
    }
    
    return formatted;
  }
  
  async getContractCode(address: string): Promise<string> {
    if (this.demoMode) {
      // Return dummy bytecode in demo mode
      return '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063209652551461003b57806330065c7f14610059575b600080fd5b610043610075565b60405161005091906100a1565b60405180910390f35b610073600480360381019061006e91906100ed565b61007e565b005b60005481565b8060008190555050565b6000819050919050565b61009b81610088565b82525050565b60006020820190506100b66000830184610092565b92915050565b600080fd5b6100ca81610088565b81146100d557600080fd5b50565b6000813590506100e7816100c1565b92915050565b600060208284031215610103576101026100bc565b5b6000610111848285016100d8565b9150509291505056fe';
    }
    
    if (!this.provider) {
      throw new Error('Provider not available');
    }
    
    return await this.provider.getCode(address);
  }
  
  async getContractAt(address: string): Promise<ethers.Contract | undefined> {
    if (this.demoMode) {
      // Return a mock contract in demo mode
      return {
        address,
        interface: { fragments: [] }
      } as any;
    }
    
    return this.contracts.get(address);
  }
  
  async getBlockTimestamp(blockNumber: number): Promise<number> {
    if (this.demoMode) {
      // Return current timestamp in demo mode
      return Math.floor(Date.now() / 1000);
    }
    
    if (!this.provider) {
      throw new Error('Provider not available');
    }
    
    const block = await this.provider.getBlock(blockNumber);
    return block ? block.timestamp : 0;
  }
  
  // Add some demo alerts
  async createDemoAlerts() {
    // Create some demo alerts for the contracts
    const contracts = await storage.getContracts();
    
    const alertTypes = [
      {
        contractId: contracts[0].id, // Feed contract
        title: "Suspicious Transfer Pattern Detected",
        severity: "HIGH",
        description: "Multiple high-value transfers to newly created wallets in short succession. Possible early signs of a rug pull.",
        aiAnalysis: "The contract's transfer function was called 17 times in 3 minutes, sending tokens to wallets that were all created within the last hour. This pattern matches known exit scam behaviors. Recommend immediate investigation."
      },
      {
        contractId: contracts[1].id, // DAO contract
        title: "Governance Parameter Change",
        severity: "MEDIUM",
        description: "Proposal to modify voting threshold was accepted with minimal participation.",
        aiAnalysis: "The proposal passed with only 12% of token holders voting, which is unusually low. The new parameters reduce the quorum needed for future proposals, potentially centralizing control."
      },
      {
        contractId: contracts[2].id, // Badge contract
        title: "Unusual Minting Activity",
        severity: "LOW",
        description: "Large batch of new badges minted to a single address.",
        aiAnalysis: "While within contract parameters, this minting activity represents a 23% increase in total supply. The receiving address has no prior history with this contract."
      }
    ];
    
    for (const alert of alertTypes) {
      await storage.createAlert(alert);
      console.log(`🔮 Created demo alert: ${alert.title}`);
    }
  }
}

export const blockchainService = new BlockchainService();
