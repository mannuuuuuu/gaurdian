import { ethers } from "ethers";

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  error: string | null;
}

export const initialWalletState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  provider: null,
  error: null
};

export const connectWallet = async (): Promise<WalletState> => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      return {
        ...initialWalletState,
        error: "MetaMask is not installed. Please install MetaMask to connect."
      };
    }

    // Create provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request account access
    const accounts = await provider.send("eth_requestAccounts", []);
    
    if (!accounts || accounts.length === 0) {
      return {
        ...initialWalletState,
        error: "No accounts found. Please connect to MetaMask."
      };
    }

    // Get the connected wallet address
    const address = accounts[0];
    
    // Get the current chain ID
    const { chainId } = await provider.getNetwork();
    
    return {
      isConnected: true,
      address,
      chainId: Number(chainId),
      provider,
      error: null
    };
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    return {
      ...initialWalletState,
      error: error instanceof Error ? error.message : "Failed to connect to wallet"
    };
  }
};

export const disconnectWallet = (): WalletState => {
  return initialWalletState;
};

export const checkIfWalletIsConnected = async (): Promise<WalletState> => {
  try {
    if (!window.ethereum) {
      return initialWalletState;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    
    if (accounts.length > 0) {
      const address = accounts[0].address;
      const { chainId } = await provider.getNetwork();
      
      return {
        isConnected: true,
        address,
        chainId: Number(chainId),
        provider,
        error: null
      };
    }
    
    return initialWalletState;
  } catch (error) {
    console.error("Error checking wallet connection:", error);
    return initialWalletState;
  }
};

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}