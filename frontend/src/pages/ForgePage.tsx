import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import AnimatedBackground from '../components/AnimatedBackground';
import NFTSlot from '../components/NFTSlot';
import ForgeButton from '../components/ForgeButton';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { getNftsForOwner } from '../lib/alchemy';
import { zetaForgeContractAddress, zetaForgeContractABI } from '../lib/contracts';
import { toHex } from 'viem';

// TypeScript declaration for ethereum object
declare global {
  interface Window {
    ethereum?: {
      request: (args: any) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

// Define ZetaChain Athens Testnet configuration - matching your wallet exactly
const zetachainAthensTestnet = {
  id: 7001,
  name: 'ZetaChain Testnet',
  network: 'zetachain-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ZETA',
    symbol: 'ZETA',
  },
  rpcUrls: {
    default: {
      http: ['https://zetachain-athens.g.allthatnode.com/archive/evm'],
    },
    public: {
      http: ['https://zetachain-athens.g.allthatnode.com/archive/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ZetaChain Explorer',
      url: 'https://explorer.athens2.zetachain.com',
    },
  },
  testnet: true,
} as const;

interface NFT {
  id: string;
  name: string;
  image: string;
  chain: string;
}

// Mock NFT data (fallback)
const mockNFTs: NFT[] = [
  {
    id: '1',
    name: 'Cyber Punk #1234',
    image:
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=400&fit=crop&crop=center',
    chain: 'Ethereum',
  },
  {
    id: '2',
    name: 'Digital Dragon #5678',
    image:
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    chain: 'Polygon',
  },
  {
    id: '3',
    name: 'Neon Knight #9012',
    image:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop&crop=center',
    chain: 'Ethereum',
  },
  {
    id: '4',
    name: 'Cosmic Cat #3456',
    image:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=center',
    chain: 'BSC',
  },
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const ForgingAnimation = ({
  isVisible,
  onComplete,
}: {
  isVisible: boolean;
  onComplete: () => void;
}) => (
  <AnimatePresence>
    {isVisible && (
      <Dialog open={isVisible}>
        <DialogContent className="max-w-4xl w-full bg-forge-void/95 border-forge-neon-blue border-2">
          <div className="relative h-96 flex items-center justify-center overflow-hidden">
            <AnimatedBackground showIntense />
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-forge-gradient-primary"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 1, 1.5, 1],
                opacity: [0, 1, 1, 1, 0.8],
              }}
              transition={{ duration: 4, ease: 'easeInOut' }}
              style={{
                boxShadow:
                  '0 0 100px hsl(193 100% 50% / 0.8), 0 0 200px hsl(262 100% 67% / 0.6)',
              }}
            />
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 bg-forge-neon-blue"
                style={{
                  height: '200px',
                  transformOrigin: 'bottom',
                  rotate: `${i * 45}deg`,
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: [0, 1, 0.8, 1.2, 0],
                  opacity: [0, 1, 0.8, 1, 0],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            ))}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <h2 className="text-4xl font-orbitron font-bold text-glow-blue">
                FORGING...
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4 }}
              onAnimationComplete={onComplete}
            />
          </div>
        </DialogContent>
      </Dialog>
    )}
  </AnimatePresence>
);

const ForgePage = () => {
  const navigate = useNavigate();

  // State management
  const [selectedNFTs, setSelectedNFTs] = useState<(NFT | undefined)[]>([undefined, undefined]);
  const [prompt, setPrompt] = useState('');
  const [showNFTModal, setShowNFTModal] = useState<number | null>(null);
  const [isForging, setIsForging] = useState(false);

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { data: hash, error: writeError, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({ 
    hash,
    confirmations: 1
  });
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  // NFT fetch/loading
  const [userNfts, setUserNfts] = useState<NFT[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [nftError, setNftError] = useState<string | null>(null);

  // Check if we're on the correct network - with bypass for undefined chain
  const isOnCorrectNetwork = chain?.id === zetachainAthensTestnet.id || (!chain && isConnected);
  const isForgingInProgress = isPending || isConfirming || isForging || isSwitchingChain;

  // Debug logging
  console.log('Current chain:', chain);
  console.log('Expected chain ID:', zetachainAthensTestnet.id);
  console.log('Current chain ID:', chain?.id);
  console.log('Is connected:', isConnected);
  console.log('Address:', address);
  console.log('Is on correct network:', isOnCorrectNetwork);

  // Check actual MetaMask network
  useEffect(() => {
    const checkMetaMaskNetwork = async () => {
      if (window.ethereum && isConnected) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const networkVersion = await window.ethereum.request({ method: 'net_version' });
          console.log('MetaMask chainId (hex):', chainId);
          console.log('MetaMask chainId (decimal):', parseInt(chainId, 16));
          console.log('MetaMask networkVersion:', networkVersion);
          
          // If MetaMask shows ZetaChain but wagmi doesn't, force a connection refresh
          if (parseInt(chainId, 16) === 7001 && (!chain || chain.id !== 7001)) {
            console.log('MetaMask is on ZetaChain but wagmi is not synced');
          }
        } catch (error) {
          console.error('Error checking MetaMask network:', error);
        }
      }
    };
    
    checkMetaMaskNetwork();
  }, [isConnected, chain]);

  // Force network switch function
  const handleNetworkSwitch = async () => {
    try {
      // First try to add the network if it doesn't exist
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${zetachainAthensTestnet.id.toString(16)}`, // Convert to hex
                chainName: zetachainAthensTestnet.name,
                rpcUrls: [zetachainAthensTestnet.rpcUrls.default.http[0]],
                nativeCurrency: zetachainAthensTestnet.nativeCurrency,
                blockExplorerUrls: [zetachainAthensTestnet.blockExplorers.default.url],
              },
            ],
          });
        } catch (addError: any) {
          // Network might already exist, try to switch
          console.log('Network might already exist:', addError);
        }

        // Now try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${zetachainAthensTestnet.id.toString(16)}` }],
        });

        // Force a page refresh after switching
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Network switch error:', error);
      if (error.code === 4902) {
        alert('Please add ZetaChain Testnet to your MetaMask manually');
      } else {
        alert(`Failed to switch network: ${error.message}`);
      }
    }
  };

  const canForge = selectedNFTs.every((nft) => nft !== undefined) && 
                   prompt.trim().length > 0 && 
                   isConnected && 
                   !isForgingInProgress;
                   // Removed network check temporarily for debugging

  // NFT selection
  const handleNFTSelect = (nft: NFT) => {
    if (showNFTModal !== null) {
      const newSelectedNFTs = [...selectedNFTs];
      newSelectedNFTs[showNFTModal] = nft;
      setSelectedNFTs(newSelectedNFTs);
      setShowNFTModal(null);
    }
  };

  // Main contract transaction logic
  const handleForge = async () => {
    try {
      if (!isConnected || !address) {
        alert("Please connect your wallet first.");
        return;
      }
  
      if (!selectedNFTs[0] || !selectedNFTs[1]) {
        alert("Please select both NFTs before forging.");
        return;
      }
  
      if (!prompt.trim()) {
        alert("Please enter a description for the transformation.");
        return;
      }
  
      // Check MetaMask network directly
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainId, 16);
        console.log('Current MetaMask chain ID:', currentChainId);
  
        if (currentChainId !== 7001) {
          alert(`Please switch to ZetaChain Testnet in MetaMask. Current: ${currentChainId}, Required: 7001`);
          return;
        }
      }
  
      setIsForging(true);
  
      const message = `Forge: ${selectedNFTs[0]?.name} + ${selectedNFTs[1]?.name}. Prompt: ${prompt}`;
  
      console.log("=== FORGE TRANSACTION DEBUG ===");
      console.log("Contract Address:", zetaForgeContractAddress);
      console.log("Message:", message);
      console.log("Message (hex):", toHex(message));
      console.log("Sender:", address);
      console.log("Contract ABI:", zetaForgeContractABI);
  
      // Check if contract exists at the address
      if (window.ethereum) {
        try {
          const code = await window.ethereum.request({
            method: 'eth_getCode',
            params: [zetaForgeContractAddress, 'latest']
          });
          console.log("Contract code at address:", code);
          if (code === '0x' || code === '0x0') {
            alert(`No contract found at address ${zetaForgeContractAddress}. Please check the contract address.`);
            setIsForging(false);
            return;
          }
        } catch (codeError) {
          console.warn("Could not check contract code:", codeError);
        }
      }
  
      // ✅ Call the new mint() function (no args)
      await writeContract({
        address: zetaForgeContractAddress,
        abi: zetaForgeContractABI,
        functionName: 'mint',
        args: [],            // no arguments needed
        gas: 200000n,        // enough for ERC721 mint
        chainId: 7001,
      });
  
      setIsForging(false);
  
    } catch (error: any) {
      console.error("=== FORGE ERROR ===");
      console.error("Error details:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error data:", error.data);
      setIsForging(false);
  
      // Better error messages
      if (error.message?.includes('execution reverted')) {
        alert(`Contract execution failed. Check if:\n1. Contract address is correct\n2. You have enough ZETA for gas\n3. Contract function exists\n\nError: ${error.message}`);
      } else if (error.message?.includes('insufficient funds')) {
        alert('Insufficient funds for gas. Please get some ZETA from the faucet.');
      } else {
        alert(`Transaction error: ${error.message || 'Unknown error'}`);
      }
    }
  };
  

  // Fetch NFTs when user connects
  useEffect(() => {
    let mounted = true;
    
    async function fetchNfts() {
      if (!isConnected || !address) return;
      
      setLoadingNfts(true);
      setNftError(null);
      
      try {
        const nfts = await getNftsForOwner(address);
        if (!mounted) return;
        
        const normalized: NFT[] = (nfts || []).map((n: any, idx: number) => ({
          id: n.id ?? n.tokenId ?? `${address}-${idx}`,
          name: n.name ?? n.title ?? `NFT #${n.tokenId ?? idx}`,
          image:
            n.image ??
            n.media?.[0]?.gateway ??
            n.media?.[0]?.thumbnail ??
            'https://via.placeholder.com/300?text=No+Image',
          chain: n.chain ?? 'Ethereum',
        }));
        
        setUserNfts(normalized);
      } catch (err: any) {
        console.error('Error fetching NFTs:', err);
        setNftError('Failed to fetch NFTs. Using mock data.');
        setUserNfts([]);
      } finally {
        if (mounted) setLoadingNfts(false);
      }
    }
    
    fetchNfts();
    
    return () => {
      mounted = false;
    };
  }, [isConnected, address]);

  // Handle transaction completion
  useEffect(() => {
    if (isConfirmed && hash) {
      console.log("✅ Transaction confirmed:", hash);
      console.log("View on explorer: https://explorer.athens2.zetachain.com/tx/" + hash);
      setIsForging(false);
      // Don't navigate immediately, let the animation complete
      setTimeout(() => {
        navigate('/gallery');
      }, 2000); // Give time for the forging animation
    }
    
    if (writeError) {
      console.error("❌ Write contract error:", writeError);
      console.error("Error details:", {
        message: writeError.message,
        cause: writeError.cause,
        name: writeError.name,
      });
      setIsForging(false);
      alert(`Transaction Error: ${writeError.message}\n\nCheck console for details.`);
    }
    
    if (receiptError) {
      console.error("❌ Receipt error:", receiptError);
      setIsForging(false);
      alert(`Transaction failed on blockchain: ${receiptError.message}`);
    }
  }, [isConfirmed, writeError, receiptError, hash, navigate]);

  // Handle pending transaction
  useEffect(() => {
    if (isPending && hash) {
      console.log("Transaction submitted:", hash);
    }
  }, [isPending, hash]);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Header
        isConnected={isConnected}
        walletAddress={address || ''}
      />

      <main className="container mx-auto px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-center text-glow-blue mb-12">
            The Forge
          </h1>
        </motion.div>

        {/* Network Warning */}
        {isConnected && !isOnCorrectNetwork && (
          <motion.div
            className="max-w-4xl mx-auto mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 text-center">
              <p className="text-yellow-200 font-medium mb-2">
                {!chain ? 'Network Detection Issue' : 'Network Mismatch Detected'}
              </p>
              <p className="text-sm text-yellow-300 mb-4">
                {!chain 
                  ? 'Wagmi cannot detect your network. Check console for MetaMask network details.'
                  : `App shows: ${chain.name} (ID: ${chain.id}) | Required: ZetaChain Testnet (ID: 7001)`
                }
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleNetworkSwitch}
                  disabled={isSwitchingChain}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-white font-medium disabled:opacity-50"
                >
                  {isSwitchingChain ? 'Switching...' : 'Force Network Switch'}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
                >
                  Refresh Page
                </button>
              </div>
              <p className="text-xs text-yellow-400 mt-2">
                Check browser console for detailed network information
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Column - Materials */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="forge-container-glow">
              <h2 className="text-2xl font-orbitron font-bold text-forge-neon-blue mb-6">
                Select Your Assets
              </h2>
              <div className="grid grid-cols-2 gap-8 justify-items-center">
                <div className="text-center space-y-4">
                  <NFTSlot
                    nft={selectedNFTs[0]}
                    placeholder="Select NFT from Collection"
                    onClick={() => setShowNFTModal(0)}
                    isActive={showNFTModal === 0}
                  />
                  <p className="text-sm text-forge-text-muted">Primary Asset</p>
                </div>
                <div className="text-center space-y-4">
                  <NFTSlot
                    nft={selectedNFTs[1]}
                    placeholder="Select NFT for Fusion"
                    onClick={() => setShowNFTModal(1)}
                    isActive={showNFTModal === 1}
                  />
                  <p className="text-sm text-forge-text-muted">Fusion Material</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Creation */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="forge-container-glow">
              <h2 className="text-2xl font-orbitron font-bold text-forge-neon-purple mb-6">
                Describe the Transformation
              </h2>
              <Textarea
                placeholder="e.g., 'Combine these with a cyberpunk aesthetic and flaming wings'..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 bg-forge-surface border-forge-border focus:border-forge-neon-purple
                              text-forge-text-primary placeholder:text-forge-text-muted
                              resize-none focus:ring-2 focus:ring-forge-neon-purple/50"
              />
              <div className="mt-8 text-center">
                <ForgeButton
                  variant="hero"
                  onClick={handleForge}
                  disabled={!canForge}
                  className="w-full text-2xl py-6"
                >
                  {isSwitchingChain ? 'SWITCHING NETWORK...' :
                   isPending ? 'CONFIRMING...' :
                   isConfirming ? 'PROCESSING...' :
                   isForging ? 'FORGING...' : 'FORGE'}
                </ForgeButton>
                
                {/* Transaction status */}
                {hash && (
                  <div className="mt-4 text-sm">
                    <p className="text-forge-neon-blue">
                      Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
                    </p>
                    {isPending && (
                      <p className="text-yellow-400">Waiting for confirmation...</p>
                    )}
                    {isConfirming && (
                      <p className="text-blue-400">Processing on blockchain...</p>
                    )}
                    {isConfirmed && (
                      <p className="text-green-400">Transaction confirmed!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* NFT Selection Modal */}
      <Dialog
        open={showNFTModal !== null}
        onOpenChange={(open) => {
          if (!open) setShowNFTModal(null);
        }}
      >
        <DialogContent className="max-w-2xl bg-forge-surface border-forge-neon-blue border-2">
          <h3 className="text-xl font-orbitron font-bold text-forge-neon-blue mb-6">
            Select an NFT
          </h3>
          {loadingNfts ? (
            <div className="py-8 text-center">Loading NFTs...</div>
          ) : nftError ? (
            <div className="py-8 text-center">
              <p className="text-yellow-400 mb-4">{nftError}</p>
              <p className="text-sm text-forge-text-muted">Showing demo NFTs for testing</p>
            </div>
          ) : null}
          
          <div className="grid grid-cols-2 gap-4">
            {(userNfts.length > 0 ? userNfts : mockNFTs).map((nft) => (
              <motion.div
                key={nft.id}
                className="forge-container p-4 cursor-pointer hover:bg-forge-border/50 transition-colors"
                onClick={() => handleNFTSelect(nft)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full aspect-square object-cover rounded-lg mb-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                  }}
                />
                <h4 className="font-medium text-forge-text-primary truncate">
                  {nft.name}
                </h4>
                <p className="text-sm text-forge-neon-blue">{nft.chain}</p>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Forging Animation */}
      <ForgingAnimation 
        isVisible={isForgingInProgress && (isPending || isConfirming)} 
        onComplete={() => {
          if (isConfirmed) {
            navigate('/gallery');
          }
        }} 
      />
    </div>
  );
};

export default ForgePage;