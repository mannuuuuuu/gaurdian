import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (kept from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Smart contracts being monitored
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull().unique(),
  type: text("type").notNull(), // "FEED", "DAO", "BADGE", etc.
  abi: jsonb("abi"), // Contract ABI if available
  status: text("status").notNull().default("HEALTHY"), // "HEALTHY", "WARNING", "ALERT"
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const insertContractSchema = createInsertSchema(contracts).pick({
  name: true,
  address: true,
  type: true,
  abi: true,
  status: true,
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// Alerts generated from AI analysis
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  severity: text("severity").notNull(), // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  title: text("title").notNull(),
  description: text("description").notNull(),
  aiAnalysis: text("ai_analysis"), // Detailed AI analysis
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolved: boolean("resolved").notNull().default(false),
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  contractId: true,
  severity: true,
  title: true, 
  description: true,
  aiAnalysis: true,
  resolved: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// Events captured from monitored contracts
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  eventName: text("event_name").notNull(),
  blockNumber: integer("block_number").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  eventData: jsonb("event_data").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).pick({
  contractId: true,
  eventName: true,
  blockNumber: true,
  transactionHash: true,
  eventData: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// AI analysis queries
export const aiQueries = pgTable("ai_queries", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  query: text("query").notNull(),
  response: text("response"),
  tokenCount: integer("token_count"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiQuerySchema = createInsertSchema(aiQueries).pick({
  contractId: true,
  query: true,
  response: true,
  tokenCount: true,
});

export type InsertAiQuery = z.infer<typeof insertAiQuerySchema>;
export type AiQuery = typeof aiQueries.$inferSelect;
