import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { monitorService } from "./services/monitor";
import { groqService } from "./services/groq";
import { blockchainService } from "./services/blockchain";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize blockchain service with demo mode
  const blockchainInitialized = await blockchainService.initialize();
  console.log(`Blockchain service initialization: ${blockchainInitialized ? 'success' : 'failed'}`);
  
  // Start monitoring service on server startup
  monitorService.start().catch(err => {
    console.error('Failed to start monitoring service:', err);
  });
  
  // Contract endpoints
  app.get('/api/contracts', async (_req: Request, res: Response) => {
    try {
      const contracts = await storage.getContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: `Error fetching contracts: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  app.get('/api/contracts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid contract ID' });
      }
      
      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: `Error fetching contract: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  // Alert endpoints
  app.get('/api/alerts', async (_req: Request, res: Response) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: `Error fetching alerts: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  app.get('/api/alerts/active', async (_req: Request, res: Response) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: `Error fetching active alerts: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  app.get('/api/alerts/contract/:id', async (req: Request, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        return res.status(400).json({ message: 'Invalid contract ID' });
      }
      
      const alerts = await storage.getAlertsByContract(contractId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: `Error fetching alerts for contract: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  app.post('/api/alerts/:id/resolve', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid alert ID' });
      }
      
      const alert = await storage.resolveAlert(id);
      
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: `Error resolving alert: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  // Event log endpoints
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const events = await storage.getEvents(limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: `Error fetching events: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  app.get('/api/events/contract/:id', async (req: Request, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        return res.status(400).json({ message: 'Invalid contract ID' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const events = await storage.getEventsByContract(contractId, limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: `Error fetching events for contract: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  // AI analysis endpoints
  app.get('/api/ai/usage', async (_req: Request, res: Response) => {
    try {
      const usage = await groqService.getTokenUsage();
      res.json(usage);
    } catch (error) {
      res.status(500).json({ message: `Error fetching AI usage: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  app.post('/api/ai/analyze-contract', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        contractId: z.number()
      });
      
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid request data', errors: result.error.format() });
      }
      
      const { contractId } = result.data;
      
      // Get the contract
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      
      // Start the analysis process
      await monitorService.scanContract(contract.address);
      
      res.json({ message: 'Contract analysis started' });
    } catch (error) {
      res.status(500).json({ message: `Error analyzing contract: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  // Monitor control endpoints
  app.post('/api/monitor/start', async (_req: Request, res: Response) => {
    try {
      if (monitorService.isActive()) {
        return res.json({ message: 'Monitoring service is already running' });
      }
      
      const success = await monitorService.start();
      
      if (success) {
        res.json({ message: 'Monitoring service started successfully' });
      } else {
        res.status(500).json({ message: 'Failed to start monitoring service' });
      }
    } catch (error) {
      res.status(500).json({ message: `Error starting monitoring service: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  app.post('/api/monitor/stop', async (_req: Request, res: Response) => {
    try {
      if (!monitorService.isActive()) {
        return res.json({ message: 'Monitoring service is already stopped' });
      }
      
      await monitorService.stop();
      res.json({ message: 'Monitoring service stopped' });
    } catch (error) {
      res.status(500).json({ message: `Error stopping monitoring service: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  app.get('/api/monitor/status', async (_req: Request, res: Response) => {
    try {
      const isActive = monitorService.isActive();
      res.json({ active: isActive });
    } catch (error) {
      res.status(500).json({ message: `Error getting monitoring status: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  return httpServer;
}
