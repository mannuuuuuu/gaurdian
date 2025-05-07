import { 
  users, type User, type InsertUser,
  contracts, type Contract, type InsertContract,
  alerts, type Alert, type InsertAlert,
  events, type Event, type InsertEvent,
  aiQueries, type AiQuery, type InsertAiQuery
} from "@shared/schema";

// Storage interface with all needed CRUD operations
export interface IStorage {
  // User operations (kept from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contract operations
  getContracts(): Promise<Contract[]>;
  getContract(id: number): Promise<Contract | undefined>;
  getContractByAddress(address: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContractStatus(id: number, status: string): Promise<Contract | undefined>;
  
  // Alert operations
  getAlerts(): Promise<Alert[]>;
  getAlertsByContract(contractId: number): Promise<Alert[]>;
  getActiveAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  resolveAlert(id: number): Promise<Alert | undefined>;
  
  // Event operations
  getEvents(limit?: number): Promise<Event[]>;
  getEventsByContract(contractId: number, limit?: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  
  // AI Query operations
  getAiQueries(): Promise<AiQuery[]>;
  getAiQueriesByContract(contractId: number): Promise<AiQuery[]>;
  createAiQuery(query: InsertAiQuery): Promise<AiQuery>;
  getTotalQueryTokenCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contracts: Map<number, Contract>;
  private alerts: Map<number, Alert>;
  private events: Map<number, Event>;
  private aiQueries: Map<number, AiQuery>;
  
  private userCurrentId: number;
  private contractCurrentId: number;
  private alertCurrentId: number;
  private eventCurrentId: number;
  private aiQueryCurrentId: number;

  constructor() {
    this.users = new Map();
    this.contracts = new Map();
    this.alerts = new Map();
    this.events = new Map();
    this.aiQueries = new Map();
    
    this.userCurrentId = 1;
    this.contractCurrentId = 1;
    this.alertCurrentId = 1;
    this.eventCurrentId = 1;
    this.aiQueryCurrentId = 1;
    
    // Initialize with Guardian contracts
    this.initGuardianContracts();
  }

  private initGuardianContracts() {
    const guardianFeed: InsertContract = {
      name: "Guardian Feed",
      address: process.env.GUARDIAN_FEED || "0xea1Ad2Ebf76b490a327eF1885863c9209994F015",
      type: "FEED",
      status: "HEALTHY"
    };
    
    const guardianDAO: InsertContract = {
      name: "Guardian DAO",
      address: process.env.GUARDIAN_DAO || "0xd4DcBae99C65079ba6CA2e99c8D5Dcc37d60456b",
      type: "DAO",
      status: "WARNING"
    };
    
    const guardianBadge: InsertContract = {
      name: "Guardian Badge",
      address: process.env.GUARDIAN_BADGE || "0x525975C25823ecb3a3875F577a5B9574aB758197",
      type: "BADGE",
      status: "ALERT"
    };
    
    this.createContract(guardianFeed);
    this.createContract(guardianDAO);
    this.createContract(guardianBadge);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Contract operations
  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }
  
  async getContract(id: number): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }
  
  async getContractByAddress(address: string): Promise<Contract | undefined> {
    return Array.from(this.contracts.values()).find(
      (contract) => contract.address.toLowerCase() === address.toLowerCase(),
    );
  }
  
  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.contractCurrentId++;
    const now = new Date();
    const contract: Contract = { 
      ...insertContract, 
      id, 
      addedAt: now,
      status: insertContract.status || 'HEALTHY',
      abi: insertContract.abi || null
    };
    this.contracts.set(id, contract);
    return contract;
  }
  
  async updateContractStatus(id: number, status: string): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;
    
    const updatedContract: Contract = {
      ...contract,
      status
    };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }
  
  // Alert operations
  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values());
  }
  
  async getAlertsByContract(contractId: number): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.contractId === contractId,
    );
  }
  
  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (alert) => !alert.resolved,
    );
  }
  
  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.alertCurrentId++;
    const now = new Date();
    const alert: Alert = { 
      ...insertAlert, 
      id, 
      createdAt: now,
      aiAnalysis: insertAlert.aiAnalysis || null,
      resolved: insertAlert.resolved || false
    };
    this.alerts.set(id, alert);
    return alert;
  }
  
  async resolveAlert(id: number): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const resolvedAlert: Alert = {
      ...alert,
      resolved: true
    };
    this.alerts.set(id, resolvedAlert);
    return resolvedAlert;
  }
  
  // Event operations
  async getEvents(limit?: number): Promise<Event[]> {
    const events = Array.from(this.events.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? events.slice(0, limit) : events;
  }
  
  async getEventsByContract(contractId: number, limit?: number): Promise<Event[]> {
    const events = Array.from(this.events.values())
      .filter(event => event.contractId === contractId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? events.slice(0, limit) : events;
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventCurrentId++;
    const now = new Date();
    const event: Event = { 
      ...insertEvent, 
      id, 
      timestamp: now
    };
    this.events.set(id, event);
    return event;
  }
  
  // AI Query operations
  async getAiQueries(): Promise<AiQuery[]> {
    return Array.from(this.aiQueries.values());
  }
  
  async getAiQueriesByContract(contractId: number): Promise<AiQuery[]> {
    return Array.from(this.aiQueries.values()).filter(
      (query) => query.contractId === contractId,
    );
  }
  
  async createAiQuery(insertQuery: InsertAiQuery): Promise<AiQuery> {
    const id = this.aiQueryCurrentId++;
    const now = new Date();
    const query: AiQuery = { 
      ...insertQuery, 
      id, 
      createdAt: now,
      response: insertQuery.response || null,
      tokenCount: insertQuery.tokenCount || 0
    };
    this.aiQueries.set(id, query);
    return query;
  }
  
  async getTotalQueryTokenCount(): Promise<number> {
    return Array.from(this.aiQueries.values()).reduce(
      (total, query) => total + (query.tokenCount || 0),
      0
    );
  }
}

export const storage = new MemStorage();
