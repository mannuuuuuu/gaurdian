import { useQuery } from "@tanstack/react-query";
import { getEvents, getContractEvents } from "@/lib/blockchain";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/groq";
import { Event } from "@shared/schema";

interface EventLogProps {
  compact?: boolean;
  contractFilter?: string;
}

const EventLog = ({ compact = false, contractFilter }: EventLogProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Handle contract filtering based on string IDs or numeric IDs
  const getContractId = (filter: string | undefined): number | null => {
    if (!filter) return null;
    
    // Handle string-based contract types (feed, dao, badge)
    if (filter === 'feed') return 1;
    if (filter === 'dao') return 2;
    if (filter === 'badge') return 3;
    
    // Try to parse as a number
    const parsedId = parseInt(filter, 10);
    return !isNaN(parsedId) ? parsedId : null;
  };
  
  const contractId = getContractId(contractFilter);
  
  const { data: events, isLoading } = useQuery({
    queryKey: contractId ? ['/api/events/contract', contractId.toString()] : ['/api/events'],
    queryFn: () => contractId ? getContractEvents(contractId, 20) : getEvents(20),
    refetchInterval: 5000, // Refetch every 5 seconds
    retry: false // Don't retry on error
  });

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const getLogTypeClass = (event: any) => {
    if (event.eventName === 'AlertSubmitted' || event.eventName === 'BadgeRevoked' || 
        event.eventName.includes('Error') || event.eventName.includes('Revoked')) {
      return 'error';
    }
    
    if (event.eventName === 'Vote' || event.eventName === 'ProposalCreated' || 
        event.eventName.includes('Warning') || event.eventName.includes('Alert')) {
      return 'warning';
    }
    
    if (event.eventName === 'ProposalExecuted' || event.eventName.includes('Success') ||
        event.eventName.includes('Confirmed') || event.eventName.includes('BadgeClaim')) {
      return 'info';
    }
    
    return '';
  };

  const formatLogEntry = (event: any) => {
    const timestamp = formatDate(event.timestamp);
    return `[${timestamp}] Event: ${event.eventName}(${formatEventParams(event.eventData)})`;
  };

  const formatEventParams = (eventData: any) => {
    if (!eventData) return '';
    
    return Object.entries(eventData)
      .map(([key, value]) => `${key}: ${formatValue(value)}`)
      .join(', ');
  };

  const formatValue = (value: any) => {
    if (typeof value === 'string' && value.startsWith('0x')) {
      return `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
    }
    return value;
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-gray-700 shadow-md mb-6 hover:shadow-lg transition-all duration-300 hover:border-gray-600">
      <div className="border-b border-gray-700 px-4 py-3 flex justify-between items-center bg-slate-800/50">
        <h2 className="font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
          {contractFilter ? 'Contract Event Log' : 'Blockchain Monitor'}
        </h2>
        <div className="flex items-center text-xs px-2 py-1 rounded-full bg-slate-700">
          <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse mr-2"></span>
          <span className="text-accent-light">
            {contractFilter ? 'Filtered View' : 'Live Monitoring'}
          </span>
        </div>
      </div>
      <div 
        ref={terminalRef}
        className={`terminal ${compact ? 'h-48' : 'h-64'} p-3 text-xs rounded-b-lg overflow-auto font-mono border-t border-gray-700 bg-slate-900/40`}
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const isScrolledToBottom = 
            Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 10;
          setAutoScroll(isScrolledToBottom);
        }}
      >
        {isLoading ? (
          <div className="terminal-line flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border border-accent border-t-transparent mr-2"></div>
            Loading events...
          </div>
        ) : events && events.length > 0 ? (
          <>
            <div className="terminal-line info">[{new Date().toISOString().replace('T', ' ').slice(0, 19)}] ✓ Connected to Soneium RPC at https://rpc.scs.soneium.io</div>
            <div className="terminal-line command">{'>'} Guardian AI monitoring service initialized with Groq LLama3-8b-8192</div>
            
            {events.map((event: any) => (
              <div 
                key={event.id} 
                className={`terminal-line ${getLogTypeClass(event)} hover:bg-slate-800/50 rounded px-1 -mx-1 transition-colors duration-200`}
              >
                {formatLogEntry(event)}
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="terminal-line info">[{new Date().toISOString().replace('T', ' ').slice(0, 19)}] ✓ Connected to Soneium RPC at https://rpc.scs.soneium.io</div>
            <div className="terminal-line command">{'>'} Guardian AI monitoring service initialized with Groq LLama3-8b-8192</div>
            <div className="terminal-line flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse mr-2"></span>
              Waiting for blockchain events...
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventLog;
