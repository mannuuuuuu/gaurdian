import { useQuery } from "@tanstack/react-query";
import { getMonitorStatus } from "@/lib/blockchain";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { connectWallet, disconnectWallet, checkIfWalletIsConnected, WalletState, initialWalletState } from "@/lib/wallet";

const NETWORK_NAMES: { [key: number]: string } = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia",
  5: "Goerli",
  137: "Polygon Mainnet",
  80001: "Mumbai",
  42161: "Arbitrum One",
  421613: "Arbitrum Goerli",
  10: "Optimism",
  420: "Optimism Goerli",
  56: "BNB Smart Chain",
  97: "BNB Testnet",
  43114: "Avalanche C-Chain",
  43113: "Avalanche Fuji",
  42220: "Celo Mainnet",
  44787: "Celo Alfajores",
  1337: "Local Network",
  31337: "Hardhat Network"
};

const Header = () => {
  const [walletState, setWalletState] = useState<WalletState>(initialWalletState);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  const { data: monitorStatus } = useQuery({
    queryKey: ['/api/monitor/status'],
    queryFn: getMonitorStatus,
  });

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkWallet = async () => {
      const walletState = await checkIfWalletIsConnected();
      setWalletState(walletState);
    };
    
    checkWallet();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletState(initialWalletState);
          toast({
            title: "Wallet Disconnected",
            description: "Your wallet has been disconnected",
            duration: 3000,
          });
        } else {
          const walletState = await checkIfWalletIsConnected();
          setWalletState(walletState);
          toast({
            title: "Account Changed",
            description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
            duration: 3000,
          });
        }
      });
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', async () => {
        const walletState = await checkIfWalletIsConnected();
        setWalletState(walletState);
        toast({
          title: "Network Changed",
          description: `Connected to ${getNetworkName(walletState.chainId)}`,
          duration: 3000,
        });
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [toast]);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const newWalletState = await connectWallet();
      setWalletState(newWalletState);
      
      if (newWalletState.error) {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: newWalletState.error,
          duration: 3000,
        });
      } else if (newWalletState.isConnected && newWalletState.address) {
        toast({
          title: "Wallet Connected",
          description: `Successfully connected to ${newWalletState.address.substring(0, 6)}...${newWalletState.address.substring(38)}`,
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        duration: 3000,
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnectWallet = () => {
    setWalletState(disconnectWallet());
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
      duration: 3000,
    });
  };
  
  const getNetworkName = (chainId: number | null): string => {
    if (!chainId) return "Unknown Network";
    return NETWORK_NAMES[chainId] || `Chain ID: ${chainId}`;
  };

  return (
    <header className="bg-slate-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <div className="text-primary text-2xl font-bold">👾 Guardian AI</div>
        <div className="hidden md:flex items-center px-2 py-1 rounded bg-slate-900 text-xs text-secondary-light">
          <span className="inline-block w-2 h-2 rounded-full bg-secondary-light mr-2 animate-pulse"></span>
          Connected to Soneium
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden md:block">
          <span className="text-xs text-gray-400">LLM:</span>
          <span className="text-sm font-medium ml-1">Groq LLama3-8b</span>
        </div>
        
        {walletState.isConnected && walletState.address ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="px-3 py-1 text-sm bg-secondary hover:bg-secondary-dark rounded-md transition"
              >
                <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                {walletState.address.substring(0, 6)}...{walletState.address.substring(38)}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Connected Wallet</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Your wallet is currently connected to Guardian AI
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <div className="bg-slate-900 p-3 rounded-md flex justify-between items-center mb-4">
                  <span className="text-gray-400 text-sm">Address:</span>
                  <span className="font-mono text-secondary-light text-sm truncate max-w-[250px]">{walletState.address}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-md flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Network:</span>
                  <span className="text-white text-sm">{getNetworkName(walletState.chainId)}</span>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button 
                    variant="outline" 
                    className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    Close
                  </Button>
                </DialogClose>
                <Button 
                  variant="destructive"
                  onClick={handleDisconnectWallet}
                >
                  Disconnect
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Button 
            className="px-3 py-1 text-sm bg-primary hover:bg-primary-dark rounded-md transition flex items-center"
            onClick={handleConnectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Connecting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 5h-4V3H9v2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
                  <rect x="9" y="12" width="6" height="6" rx="0.5" ry="0.5" />
                  <path d="M12 12v-3" />
                </svg>
                Connect MetaMask
              </>
            )}
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
