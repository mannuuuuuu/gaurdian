import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface ContractScanProgressProps {
  address: string;
  onComplete: () => void;
}

const ContractScanProgress = ({ address, onComplete }: ContractScanProgressProps) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  
  // Stages of scanning process
  const stages = [
    { title: 'Initializing scan', description: 'Setting up the scanning environment...' },
    { title: 'Retrieving contract code', description: `Fetching the source code for ${address.substring(0, 6)}...${address.substring(38)}` },
    { title: 'Analyzing syntax', description: 'Parsing Solidity code and identifying patterns...' },
    { title: 'Running vulnerability scan', description: 'Checking for common security vulnerabilities...' },
    { title: 'Static analysis', description: 'Performing deep static analysis of contract logic...' },
    { title: 'Gas optimization analysis', description: 'Identifying inefficient gas usage patterns...' },
    { title: 'Symbolic execution', description: 'Simulating contract execution to find edge cases...' },
    { title: 'Generating report', description: 'Compiling findings into a comprehensive report...' },
    { title: 'Scan complete', description: 'Your contract security report is ready!' }
  ];
  
  // Simulate scan progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        // Calculate new progress value
        const newProgress = Math.min(oldProgress + Math.random() * 2, 100);
        
        // Update stage based on progress
        const newStage = Math.min(Math.floor(newProgress / (100 / (stages.length - 1))), stages.length - 1);
        setStage(newStage);
        
        // Call onComplete when progress is complete
        if (newProgress === 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
        
        return newProgress;
      });
    }, 300);
    
    return () => {
      clearInterval(timer);
    };
  }, [onComplete, stages.length]);
  
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center mb-6">
        <div className="bg-primary/20 p-2 rounded-full mr-3">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">
          <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Scanning Contract with Quill.ai
          </span>
        </h2>
      </div>
      
      <div className="space-y-6">
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-white font-medium">{stages[stage].title}</span>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <Progress className="h-2" value={progress} />
          <p className="text-sm text-gray-400 mt-2">{stages[stage].description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stages.map((s, i) => (
            <div 
              key={i} 
              className={`p-3 rounded-lg border ${
                i < stage ? 'bg-primary/10 border-primary/30 text-white' : 
                i === stage ? 'bg-primary/5 border-primary/20 text-white animate-pulse' : 
                'bg-slate-900 border-slate-700 text-gray-500'
              } transition-all duration-200`}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 flex items-center justify-center rounded-full mr-2 ${
                  i < stage ? 'bg-primary text-black' : 
                  i === stage ? 'border-2 border-primary bg-transparent' : 
                  'border border-gray-600 bg-transparent'
                }`}>
                  {i < stage && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {i === stage && (
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  )}
                </div>
                <span className="text-sm truncate">{s.title}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-white mb-3">What We're Checking</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-primary mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-white">Reentrancy Vulnerabilities</h4>
                <p className="text-xs text-gray-400">Detecting potential recursive call attacks</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="w-5 h-5 text-primary mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-white">Integer Overflow/Underflow</h4>
                <p className="text-xs text-gray-400">Checking for arithmetic vulnerabilities</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="w-5 h-5 text-primary mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-white">Access Control Issues</h4>
                <p className="text-xs text-gray-400">Identifying permission and authentication flaws</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="w-5 h-5 text-primary mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-white">Gas Optimization</h4>
                <p className="text-xs text-gray-400">Finding inefficient patterns and suggesting improvements</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractScanProgress;