import { apiRequest } from './queryClient';

// Function to handle AI analysis requests
export async function analyzeSmartContract(contractId: number) {
  try {
    await apiRequest('POST', '/api/ai/analyze-contract', { contractId });
    return { success: true };
  } catch (error) {
    console.error('Error analyzing smart contract:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Function to get AI usage statistics
export async function getAiUsage() {
  try {
    const response = await fetch('/api/ai/usage');
    if (!response.ok) {
      throw new Error(`Error fetching AI usage: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    throw error;
  }
}

// Helper function to format a severity from the API to a display format
export function formatSeverity(severity: string) {
  switch (severity.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return {
        label: severity === 'HIGH' ? 'High' : 'Critical',
        color: 'text-alert-light',
        bgColor: 'bg-alert/20',
        borderColor: 'border-alert/30',
        buttonBg: 'bg-alert hover:bg-alert-dark'
      };
    case 'MEDIUM':
    case 'WARNING':
      return {
        label: 'Medium',
        color: 'text-accent-light',
        bgColor: 'bg-amber-900/20', 
        borderColor: 'border-amber-700/30',
        buttonBg: 'bg-amber-600 hover:bg-amber-700'
      };
    case 'LOW':
    case 'INFO':
      return {
        label: 'Low',
        color: 'text-primary-light',
        bgColor: 'bg-primary-dark/20',
        borderColor: 'border-primary-dark/30',
        buttonBg: 'bg-primary hover:bg-primary-dark'
      };
    default:
      return {
        label: 'Unknown',
        color: 'text-gray-300',
        bgColor: 'bg-gray-800/50',
        borderColor: 'border-gray-700',
        buttonBg: 'bg-gray-600 hover:bg-gray-700'
      };
  }
}

// Format date strings to a more readable format
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}
