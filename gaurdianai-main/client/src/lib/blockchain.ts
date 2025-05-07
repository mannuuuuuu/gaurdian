import { apiRequest } from './queryClient';

// Contract related functions
export async function getContracts() {
  const response = await fetch('/api/contracts');
  if (!response.ok) throw new Error('Failed to fetch contracts');
  return response.json();
}

export async function getContract(id: number) {
  const response = await fetch(`/api/contracts/${id}`);
  if (!response.ok) throw new Error('Failed to fetch contract details');
  return response.json();
}

// Alert related functions
export async function getAlerts() {
  const response = await fetch('/api/alerts');
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
}

export async function getActiveAlerts() {
  const response = await fetch('/api/alerts/active');
  if (!response.ok) throw new Error('Failed to fetch active alerts');
  return response.json();
}

export async function getContractAlerts(contractId: number) {
  const response = await fetch(`/api/alerts/contract/${contractId}`);
  if (!response.ok) throw new Error('Failed to fetch contract alerts');
  return response.json();
}

export async function resolveAlert(alertId: number) {
  return apiRequest('POST', `/api/alerts/${alertId}/resolve`, {});
}

// Event related functions
export async function getEvents(limit?: number) {
  const url = limit ? `/api/events?limit=${limit}` : '/api/events';
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
}

export async function getContractEvents(contractId: number, limit?: number) {
  const url = limit 
    ? `/api/events/contract/${contractId}?limit=${limit}` 
    : `/api/events/contract/${contractId}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch contract events');
  return response.json();
}

// AI analysis related functions
export async function getAiUsage() {
  const response = await fetch('/api/ai/usage');
  if (!response.ok) throw new Error('Failed to fetch AI usage');
  return response.json();
}

export async function analyzeContract(contractId: number) {
  return apiRequest('POST', '/api/ai/analyze-contract', { contractId });
}

// Monitor control functions
export async function startMonitoring() {
  return apiRequest('POST', '/api/monitor/start', {});
}

export async function stopMonitoring() {
  return apiRequest('POST', '/api/monitor/stop', {});
}

export async function getMonitorStatus() {
  const response = await fetch('/api/monitor/status');
  if (!response.ok) throw new Error('Failed to fetch monitor status');
  return response.json();
}
