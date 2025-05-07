import { useQuery } from "@tanstack/react-query";
import { getContracts } from "@/lib/blockchain";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContractWatchlist = () => {
  const { toast } = useToast();
  const { data: contracts, isLoading } = useQuery({
    queryKey: ['/api/contracts'],
    queryFn: getContracts
  });

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address).then(
      () => {
        toast({
          title: "Address copied",
          description: "Contract address copied to clipboard",
          duration: 2000,
        });
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Failed to copy address to clipboard",
          duration: 2000,
        });
      }
    );
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 10)}...${address.substring(address.length - 4)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'HEALTHY':
        return <span className="px-2 py-1 text-xs rounded-full bg-secondary-dark/20 text-secondary-light">Healthy</span>;
      case 'WARNING':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-900/20 text-accent-light">Warning</span>;
      case 'ALERT':
        return <span className="px-2 py-1 text-xs rounded-full bg-alert/20 text-alert-light">Alert</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-800/50 text-gray-400">Unknown</span>;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-gray-700 shadow-md col-span-1 lg:col-span-2 hover:shadow-lg transition-all duration-300 hover:border-gray-600">
      <div className="border-b border-gray-700 px-4 py-3 flex justify-between items-center bg-slate-800/50">
        <h2 className="font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Monitored Contracts
        </h2>
        <button className="text-xs bg-secondary/10 text-secondary hover:text-secondary-light px-2 py-1 rounded-md transition-colors duration-200">
          View All
        </button>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts && contracts.map((contract: any, index: number) => (
              <div 
                key={contract.id} 
                className={`flex flex-col md:flex-row justify-between py-3 px-2 rounded-md ${
                  index < contracts.length - 1 ? 'border-b border-gray-700' : ''
                } hover:bg-slate-700/50 transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full ${
                    contract.status === 'HEALTHY' ? 'bg-secondary/20' : 
                    contract.status === 'WARNING' ? 'bg-amber-900/20' : 
                    'bg-alert/20'
                  } flex items-center justify-center mr-3`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${
                      contract.status === 'HEALTHY' ? 'text-secondary-light' : 
                      contract.status === 'WARNING' ? 'text-accent-light' : 
                      'text-alert-light'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <div className="font-medium text-white">{contract.name}</div>
                    <div className="text-xs text-gray-400 font-mono flex items-center">
                      <span className="truncate max-w-[180px]">{truncateAddress(contract.address)}</span>
                      <button 
                        className="text-primary hover:text-primary-light ml-1 focus:outline-none" 
                        title="Copy to clipboard"
                        onClick={() => copyToClipboard(contract.address)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center mt-2 md:mt-0 space-x-2">
                  {getStatusBadge(contract.status)}
                  <button className="p-1.5 rounded-full hover:bg-slate-600 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractWatchlist;
