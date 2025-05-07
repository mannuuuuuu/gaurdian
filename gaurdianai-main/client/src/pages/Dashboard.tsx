import { useQuery } from "@tanstack/react-query";
import { useState, lazy, Suspense } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import StatusCard from "@/components/dashboard/StatusCard";
import ContractWatchlist from "@/components/dashboard/ContractWatchlist";
import AIAlertPanel from "@/components/dashboard/AIAlertPanel";
import EventLog from "@/components/dashboard/EventLog";
import ContractScanProgress from "@/components/dashboard/ContractScanProgress";
import { getContracts, getActiveAlerts, getAiUsage, analyzeContract, getMonitorStatus } from "@/lib/blockchain";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Alert } from "@shared/schema";
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Lazy-loaded components
const ContractScanResults = lazy(() => import('@/components/dashboard/ContractScanResults'));

const Dashboard = () => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [location] = useLocation();
  
  // Match different routes to determine current view
  const [, params] = useRoute("/contracts/:id");
  const contractId = params?.id;
  
  // Determine the current page based on location
  const isMainDashboard = location === "/";
  const isAlertsPage = location === "/alerts";
  const isReportsPage = location === "/reports";
  const isContractPage = location.startsWith("/contracts/");
  const isSettingsPage = location === "/settings";
  
  const { data: contracts } = useQuery({
    queryKey: ['/api/contracts'],
    queryFn: getContracts
  });
  
  const { data: alerts } = useQuery({
    queryKey: ['/api/alerts/active'],
    queryFn: getActiveAlerts
  });
  
  const { data: aiUsage } = useQuery({
    queryKey: ['/api/ai/usage'],
    queryFn: getAiUsage
  });
  
  const { data: monitorStatus } = useQuery({
    queryKey: ['/api/monitor/status'],
    queryFn: getMonitorStatus
  });

  const handleRefresh = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/alerts/active'] });
    queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    queryClient.invalidateQueries({ queryKey: ['/api/ai/usage'] });
    queryClient.invalidateQueries({ queryKey: ['/api/monitor/status'] });
    
    toast({
      title: "Refreshed",
      description: "Dashboard data has been refreshed",
      duration: 2000,
    });
  };
  
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [contractAddress, setContractAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [scanningState, setScanningState] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [contractSource, setContractSource] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any>(null);
  
  const handleScanButtonClick = () => {
    setScanDialogOpen(true);
    setContractAddress('');
    setAddressError('');
  };
  
  const validateAddress = (address: string) => {
    // Basic validation for Ethereum addresses
    if (!address) {
      return 'Contract address is required';
    }
    
    if (!address.startsWith('0x')) {
      return 'Contract address must start with 0x';
    }
    
    if (address.length !== 42) {
      return 'Contract address must be 42 characters long (including 0x)';
    }
    
    const hexRegex = /^0x[0-9a-fA-F]{40}$/;
    if (!hexRegex.test(address)) {
      return 'Contract address must contain only hexadecimal characters';
    }
    
    return '';
  };
  
  const handleQuillScanComplete = async () => {
    try {
      // Import and use functions from the quillai.ts
      const { scanContract, fetchContractSource } = await import('@/lib/quillai');
      
      // Fetch contract source code
      const source = await fetchContractSource(contractAddress);
      setContractSource(source);
      
      // Run the scan and get results
      const results = await scanContract(contractAddress);
      setScanResults(results);
      
      // Update state to show results
      setScanningState('results');
      
      // Show success notification
      toast({
        title: "Scan completed",
        description: `Security analysis for ${contractAddress.substring(0, 6)}...${contractAddress.substring(38)} is ready`,
        duration: 3000,
      });
      
      // Refresh alerts in case scan generated new alerts
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/active'] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 3000,
      });
      setScanningState('idle');
    } finally {
      setIsScanning(false);
    }
  };
  
  const handleScan = async () => {
    const error = validateAddress(contractAddress);
    if (error) {
      setAddressError(error);
      return;
    }
    
    setAddressError('');
    setScanDialogOpen(false);
    setIsScanning(true);
    setScanningState('scanning');
    
    // For demo purposes, we're using the Quill.ai contract scanning
    // This will call handleQuillScanComplete when the scanning process is complete
    
    toast({
      title: "Scan initiated",
      description: `Analyzing contract at ${contractAddress.substring(0, 6)}...${contractAddress.substring(38)}`,
      duration: 2000,
    });
  };
  
  const resetScanState = () => {
    setScanningState('idle');
    setContractAddress('');
    setContractSource(null);
    setScanResults(null);
  };

  return (
    <div className="bg-slate-900 text-gray-100 min-h-screen font-sans flex flex-col">
      <Header />
      
      <div className="flex flex-grow overflow-hidden">
        <Sidebar />
        
        <main className="flex-grow flex flex-col h-full overflow-hidden">
          <div className="px-4 py-4 md:px-6 border-b border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-white bg-gradient-to-r from-primary-light to-white bg-clip-text text-transparent">
                {isMainDashboard && "Monitoring Dashboard"}
                {isAlertsPage && "Security Alerts"}
                {isReportsPage && "Analytics Reports"}
                {isContractPage && `Contract Details: ${contractId}`}
                {isSettingsPage && "Settings"}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {isMainDashboard && "Real-time smart contract guardian on Soneium network"}
                {isAlertsPage && "Security warnings and threat notifications"}
                {isReportsPage && "AI-powered analysis and insights"}
                {isContractPage && "Detailed information and activity logs"}
                {isSettingsPage && "Configure monitoring parameters and notification settings"}
              </p>
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <Button
                onClick={handleRefresh}
                className="flex items-center px-3 py-1.5 bg-secondary hover:bg-secondary-dark text-white rounded-md text-sm transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
              <Button
                onClick={handleScanButtonClick}
                disabled={isScanning}
                className="flex items-center px-3 py-1.5 bg-accent hover:bg-accent-dark text-white rounded-md text-sm transition ml-2"
              >
                {isScanning ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-1"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    New Scan
                  </>
                )}
              </Button>
              
              <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
                <DialogContent className="bg-slate-800 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Scan Smart Contract</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Enter the address of the smart contract you want to analyze for security vulnerabilities.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <div className="space-y-3">
                      <label className="text-sm text-gray-300">Contract Address</label>
                      <Input
                        placeholder="0x..."
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                        className="bg-slate-900 border-gray-700 text-white placeholder:text-gray-500"
                      />
                      {addressError && (
                        <div className="text-xs text-red-400 mt-1">{addressError}</div>
                      )}
                    </div>
                    
                    <div className="bg-slate-900/50 rounded-md p-3 mt-4 border border-gray-700">
                      <h4 className="text-sm font-medium text-white mb-2">What we'll scan for:</h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        <li className="flex items-center">
                          <svg className="w-3 h-3 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Reentrancy vulnerabilities
                        </li>
                        <li className="flex items-center">
                          <svg className="w-3 h-3 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Integer overflow/underflow
                        </li>
                        <li className="flex items-center">
                          <svg className="w-3 h-3 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Access control issues
                        </li>
                        <li className="flex items-center">
                          <svg className="w-3 h-3 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Suspicious transaction patterns
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setScanDialogOpen(false)}
                      className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleScan}
                      className="bg-accent hover:bg-accent-dark text-white"
                    >
                      Start Scan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex-grow overflow-auto p-4">
            {/* Quill.ai Contract Scanning States */}
            {isMainDashboard && scanningState === 'scanning' && (
              <ContractScanProgress address={contractAddress} onComplete={handleQuillScanComplete} />
            )}
            
            {isMainDashboard && scanningState === 'results' && scanResults && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Scan Results</h2>
                  <Button 
                    variant="outline" 
                    className="text-sm border-gray-700 text-gray-300 hover:text-white hover:bg-slate-700"
                    onClick={resetScanState}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                  </Button>
                </div>
                <Suspense fallback={<div className="bg-slate-800 p-8 rounded-lg border border-gray-700 text-center">Loading scan results...</div>}>
                  <ContractScanResults result={scanResults} sourceCode={contractSource || undefined} />
                </Suspense>
              </div>
            )}
            
            {/* Main Dashboard View */}
            {isMainDashboard && scanningState === 'idle' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatusCard />
                  
                  <div className="bg-slate-800 rounded-lg p-4 border border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-gray-400 text-sm font-medium">Monitored Contracts</h3>
                        <p className="text-xl font-bold text-white mt-1 bg-gradient-to-r from-secondary-light to-secondary bg-clip-text text-transparent">{contracts?.length || 0}</p>
                      </div>
                      <div className="bg-secondary/10 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <span className="text-secondary-light font-medium">+1</span>
                      <span className="text-gray-400 ml-1">from last week</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 border border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-gray-400 text-sm font-medium">Active Alerts</h3>
                        <p className="text-xl font-bold text-white mt-1 bg-gradient-to-r from-alert-light to-alert bg-clip-text text-transparent">{alerts?.length || 0}</p>
                      </div>
                      <div className="bg-alert/10 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-alert" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-1 text-xs">
                      <div className="bg-red-900/20 text-alert-light rounded-md px-2 py-1.5 text-center font-medium border border-red-900/30">
                        {alerts?.filter((a: Alert) => a.severity === 'HIGH').length || 0} High
                      </div>
                      <div className="bg-amber-900/20 text-accent-light rounded-md px-2 py-1.5 text-center font-medium border border-amber-900/30">
                        {alerts?.filter((a: Alert) => a.severity === 'MEDIUM').length || 0} Med
                      </div>
                      <div className="bg-blue-900/20 text-blue-300 rounded-md px-2 py-1.5 text-center font-medium border border-blue-900/30">
                        {alerts?.filter((a: Alert) => a.severity === 'LOW').length || 0} Low
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 border border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-gray-400 text-sm font-medium">AI Analysis</h3>
                        <p className="text-xl font-bold text-white mt-1 bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">{aiUsage?.used || 0} Queries</p>
                      </div>
                      <div className="bg-primary/10 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 mt-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary/70 to-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${aiUsage?.percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-gray-400 flex justify-between">
                      <span>{aiUsage?.used.toLocaleString() || 0} used</span>
                      <span>{aiUsage?.percentage.toFixed(1) || 0}% of quota</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <ContractWatchlist />
                  <AIAlertPanel />
                </div>
                
                <EventLog />
              </>
            )}
            
            {/* Alerts Page */}
            {isAlertsPage && (
              <div className="bg-slate-800 rounded-lg p-6 border border-gray-700 shadow-md">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-alert" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Security Alerts
                </h2>
                <AIAlertPanel fullSize={true} />
              </div>
            )}
            
            {/* Reports Page */}
            {isReportsPage && (
              <div className="bg-slate-800 rounded-lg p-6 border border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-600">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <div className="bg-accent/10 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
                    Analytics Reports
                  </span>
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-700 p-5 rounded-lg border border-slate-600 hover:shadow-md transition-all duration-200 hover:border-slate-500">
                    <div className="flex items-center mb-4">
                      <div className="bg-primary/20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-white">AI Usage Statistics</h3>
                    </div>
                    
                    <div className="w-full bg-slate-700 rounded-full h-3 mt-3 mb-5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary/70 to-primary h-3 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${aiUsage?.percentage || 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700">
                        <div className="text-3xl font-bold text-white bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                          {aiUsage?.used.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Queries Used</div>
                      </div>
                      
                      <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700">
                        <div className="text-3xl font-bold text-white bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                          {aiUsage?.limit.toLocaleString() || 100000}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Total Quota</div>
                      </div>
                      
                      <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700">
                        <div className="text-3xl font-bold text-white bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                          {aiUsage?.percentage.toFixed(1) || 0}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Utilization</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 p-5 rounded-lg border border-slate-600 hover:shadow-md transition-all duration-200 hover:border-slate-500">
                    <div className="flex items-center mb-4">
                      <div className="bg-accent/20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-white">Event Metrics</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700 hover:border-accent-dark/30 transition-all duration-200">
                        <div className="text-3xl font-bold text-white bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">3</div>
                        <div className="text-xs text-gray-400 mt-1">Events Today</div>
                      </div>
                      
                      <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700 hover:border-accent-dark/30 transition-all duration-200">
                        <div className="text-3xl font-bold text-white bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">12</div>
                        <div className="text-xs text-gray-400 mt-1">This Week</div>
                      </div>
                      
                      <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700 hover:border-accent-dark/30 transition-all duration-200">
                        <div className="text-3xl font-bold text-white bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">47</div>
                        <div className="text-xs text-gray-400 mt-1">This Month</div>
                      </div>
                    </div>
                    
                    <div className="mt-5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Contract Events</span>
                        <span className="text-sm text-white">60%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4">
                        <div className="bg-accent h-2.5 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Security Alerts</span>
                        <span className="text-sm text-white">25%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4">
                        <div className="bg-alert h-2.5 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">System Operations</span>
                        <span className="text-sm text-white">15%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2.5">
                        <div className="bg-secondary h-2.5 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Blockchain Activity
                  </h3>
                  <EventLog compact={true} />
                </div>
              </div>
            )}
            
            {/* Contract Details Page */}
            {isContractPage && (
              <div className="bg-slate-800 rounded-lg p-6 border border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-600">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <div className="bg-secondary/10 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
                    Contract Details: {contractId && contractId.charAt(0).toUpperCase() + contractId.slice(1)}
                  </span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {contracts?.filter((c: any) => {
                    // Match contract type with URL parameter 
                    return c.type && contractId && 
                      (c.type.toLowerCase() === contractId.toLowerCase() ||
                       c.type.toLowerCase() === (contractId === 'feed' ? 'feed' : 
                                                contractId === 'dao' ? 'dao' : 
                                                contractId === 'badge' ? 'badge' : ''));
                  }).map((contract: any) => (
                    <div 
                      key={contract.id} 
                      className="bg-slate-700 p-5 rounded-lg border border-slate-600 hover:shadow-md transition-all duration-200 hover:border-slate-500"
                    >
                      <div className="flex items-center mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          contract.status === 'HEALTHY' ? 'bg-secondary/20' : 
                          contract.status === 'WARNING' ? 'bg-amber-900/20' : 
                          'bg-alert/20'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${
                            contract.status === 'HEALTHY' ? 'text-secondary-light' : 
                            contract.status === 'WARNING' ? 'text-amber-300' : 
                            'text-alert-light'
                          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-white">{contract.name}</h3>
                      </div>
                      
                      <div className="space-y-3 mt-2 text-sm text-gray-300">
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-xs mb-1">Contract Address</span>
                          <span className="font-mono bg-slate-800 px-3 py-1.5 rounded-md text-secondary-light text-xs overflow-x-auto whitespace-nowrap">
                            {contract.address}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            contract.status === 'HEALTHY' ? 'bg-secondary/20 text-secondary-light' : 
                            contract.status === 'WARNING' ? 'bg-amber-900/20 text-amber-300' : 
                            'bg-alert/20 text-alert-light'
                          }`}>
                            {contract.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Added:</span>
                          <span className="text-white">
                            {new Date(contract.addedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Contract Event History
                  </h3>
                  <EventLog contractFilter={contractId || ""} />
                </div>
              </div>
            )}
            
            {/* Settings Page */}
            {isSettingsPage && (
              <div className="bg-slate-800 rounded-lg p-6 border border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-600">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                    Guardian Settings
                  </span>
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-700 p-5 rounded-lg border border-slate-600 hover:shadow-md transition-all duration-200 hover:border-slate-500">
                    <div className="flex items-center mb-4">
                      <div className="bg-secondary/20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-white">Monitor Settings</h3>
                    </div>
                    
                    <div className="space-y-5 mt-2">
                      <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">Monitor Service Status</span>
                          <span className="text-xs text-gray-400">Enable/disable blockchain monitoring</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`${monitorStatus?.active ? 'border-secondary text-secondary hover:bg-secondary/20' : 'border-alert text-alert hover:bg-alert/20'}`}
                        >
                          {monitorStatus?.active ? "Active" : "Inactive"}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">AI Analysis Frequency</span>
                          <span className="text-xs text-gray-400">How often contracts are analyzed</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-primary text-primary hover:bg-primary/20"
                        >
                          Every 4 hours
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">Alert Severity Threshold</span>
                          <span className="text-xs text-gray-400">Minimum level for notifications</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-accent text-accent hover:bg-accent/20"
                        >
                          Medium
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 p-5 rounded-lg border border-slate-600 hover:shadow-md transition-all duration-200 hover:border-slate-500">
                    <div className="flex items-center mb-4">
                      <div className="bg-primary/20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-white">AI Settings</h3>
                    </div>
                    
                    <div className="space-y-5 mt-2">
                      <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">AI Model</span>
                          <span className="text-xs text-gray-400">AI model used for analysis</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-primary text-primary hover:bg-primary/20"
                        >
                          LLama3-8b-8192
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">Analysis Depth</span>
                          <span className="text-xs text-gray-400">Contract inspection detail level</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-primary text-primary hover:bg-primary/20"
                        >
                          Comprehensive
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">API Key Status</span>
                          <span className="text-xs text-gray-400">Groq API key configuration</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-alert text-alert hover:bg-alert/20"
                        >
                          Not Set
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    variant="outline"
                    className="mr-2 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
                  >
                    Reset to Defaults
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
