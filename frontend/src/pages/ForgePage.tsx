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
import { useConfig } from 'wagmi';
import { useContractRead } from "wagmi";
import { parseAbiItem, decodeEventLog } from 'viem';

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

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
console.log("Pinata JWT prefix:", PINATA_JWT?.slice(0, 30), "length:", PINATA_JWT?.length);



// Pinata JWT token - Replace with your actual token


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

// Helper function to enhance prompt for better AI generation
const styles = ["vaporwave", "glitch", "neon noir", "cyberpunk fantasy", "sci-fi surreal"];
const colors = ["glowing", "fiery", "holographic", "metallic", "iridescent"];

const enhancePrompt = (userPrompt: string, selectedNFTs: (NFT | undefined)[]): string => {
  const cleanPrompt = userPrompt.replace(/[^\w\s,.-]/g, '').trim();
  const styleToken = styles[Math.floor(Math.random() * styles.length)];
  const colorToken = colors[Math.floor(Math.random() * colors.length)];

  const nftTraits = selectedNFTs
    .map(nft => nft?.name)
    .filter(Boolean)
    .join(', ');

  const baseEnhancement = `Create a high-quality NFT artwork. `;
  const styleGuide = `Style: Cyberpunk, futuristic, neon colors, ${styleToken}, ${colorToken}. `;
  const qualityGuide = `Requirements: Highly detailed, 1:1 aspect ratio, professional quality. `;

  return `${baseEnhancement}${styleGuide}${qualityGuide}Description: ${cleanPrompt}${nftTraits ? ` | Based on NFTs: ${nftTraits}` : ''}`;
};

// Helper function to download image from URL with retry logic
const downloadImage = async (imageUrl: string, maxRetries: number = 3): Promise<Blob> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to download image from:`, imageUrl);
      
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Verify it's actually an image
      if (!blob.type.startsWith('image/')) {
        throw new Error(`Invalid content type: ${blob.type}`);
      }
      
      return blob;
    } catch (error) {
      console.error(`Download attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to download image after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  
  throw new Error('Unexpected error in download retry loop');
};

// Helper function to upload image to Pinata IPFS
const uploadToPinata = async (imageBlob: Blob, filename: string = 'forged-nft.png'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', imageBlob, filename);
  
  const pinataMetadata = JSON.stringify({
    name: filename,
    keyvalues: {
      service: 'zetaforge',
      type: 'generated-art'
    }
  });
  formData.append('pinataMetadata', pinataMetadata);

  const pinataOptions = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', pinataOptions);

  


  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata upload failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
};

const ForgingAnimation = ({
  isVisible,
  onComplete,
  status = "FORGING..."
}: {
  isVisible: boolean;
  onComplete: () => void;
  status?: string;
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
                {status}
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
  const [newTokenId, setNewTokenId] = useState<string | null>(null);
  // State management
  const [selectedNFTs, setSelectedNFTs] = useState<(NFT | undefined)[]>([undefined, undefined]);
  const [prompt, setPrompt] = useState('');
  const [showNFTModal, setShowNFTModal] = useState<number | null>(null);
  const [isForging, setIsForging] = useState(false);
  const [forgingStatus, setForgingStatus] = useState("FORGING...");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

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

  // NFT selection
  const handleNFTSelect = (nft: NFT) => {
    if (showNFTModal !== null) {
      const newSelectedNFTs = [...selectedNFTs];
      newSelectedNFTs[showNFTModal] = nft;
      setSelectedNFTs(newSelectedNFTs);
      setShowNFTModal(null);
    }
  };

  // Updated handleForge function with better error handling and fallbacks
  const handleForge = async () => {
    if (!isConnected || !address || !prompt || !selectedNFTs[0] || !selectedNFTs[1]) {
      alert("Please connect wallet, select both NFTs, and enter a prompt.");
      return;
    }

    if (PINATA_JWT === "YOUR_PINATA_JWT_HERE") {
      alert("Please configure your Pinata JWT token first!");
      return;
    }

    setIsForging(true);
    setForgingStatus("GENERATING IMAGE...");

    try {
      console.log("🎨 Starting image generation process...");
      const nft1_name = selectedNFTs[0]?.name || 'a mysterious cybernetic entity';
      const nft2_name = selectedNFTs[1]?.name || 'a powerful digital spirit';
      const userPrompt = prompt;

      // Step 1: Enhance and clean the prompt
      const enhancedPrompt = `A cinematic, high-detail digital art fusion of a "${nft1_name}" and a "${nft2_name}", reimagined in the style of: ${userPrompt}`;

      console.log("Enhanced prompt:", enhancedPrompt);
      
      // Step 2: Try multiple Pollinations endpoints/approaches
      setForgingStatus("CREATING DIGITAL ART...");
      
      let imageBlob: Blob | null = null;
      const promptVariations = [
        enhancedPrompt,
        enhancedPrompt.replace(/[^a-zA-Z0-9\s]/g, ''), // Remove all special characters
        prompt.replace(/[^a-zA-Z0-9\s]/g, ''), // Use original prompt without special chars
        "digital fantasy art" // Fallback simple prompt
      ];
      
      for (let i = 0; i < promptVariations.length; i++) {
        const currentPrompt = promptVariations[i];
        console.log(`Trying prompt variation ${i + 1}:`, currentPrompt);
        
        try {
          // Use different Pollinations URL formats
          const urlVariations = [
            `https://image.pollinations.ai/prompt/${encodeURIComponent(currentPrompt)}`,
            `https://pollinations.ai/p/${encodeURIComponent(currentPrompt)}`,
            `https://image.pollinations.ai/prompt/${encodeURIComponent(currentPrompt)}?width=512&height=512`,
          ];
          
          for (const url of urlVariations) {
            try {
              console.log("Trying URL:", url);
              imageBlob = await downloadImage(url, 2); // 2 retries per URL
              if (imageBlob) {
                console.log("✅ Successfully generated image with variation:", currentPrompt);
                break;
              }
            } catch (urlError) {
              console.log("URL failed:", url, urlError.message);
              continue;
            }
          }
          
          if (imageBlob) break; // Success, exit prompt variations loop
          
        } catch (promptError) {
          console.log(`Prompt variation ${i + 1} failed:`, promptError.message);
          continue;
        }
      }
      
      if (!imageBlob) {
        throw new Error("All image generation attempts failed. Please try a simpler prompt or try again later.");
      }
      
      console.log("Image generated successfully, size:", imageBlob.size);
      
      // Step 3: Upload to Pinata IPFS
      setForgingStatus("UPLOADING TO IPFS...");
      const timestamp = Date.now();
      const filename = `forged-nft-${timestamp}.png`;
      const ipfsUrl = await uploadToPinata(imageBlob, filename);
      console.log("Image uploaded to IPFS:", ipfsUrl);
      
      setGeneratedImageUrl(ipfsUrl);
      
      // Step 4: Mint NFT with the IPFS URL
      setForgingStatus("MINTING NFT...");
      console.log("Calling mint function with IPFS URL:", ipfsUrl);
      
      writeContract({
        address: zetaForgeContractAddress,
        abi: zetaForgeContractABI,
        functionName: 'mint',
        args: [ipfsUrl],
        gas: 500000n,
      });

    } catch (error: any) {
      console.error("❌ Forging process failed:", error);
      setIsForging(false);
      setForgingStatus("FORGING...");
      
      // Provide more specific error messages
      if (error.message.includes('All image generation attempts failed')) {
        alert("Image generation failed. Please try:\n• A simpler prompt\n• Removing special characters\n• Trying again in a few minutes");
      } else if (error.message.includes('Pinata upload failed')) {
        alert(`Failed to upload image to IPFS: ${error.message}`);
      } else {
        alert(`Forging failed: ${error.message}`);
      }
    }
  };

  // This hook automatically waits for the transaction to complete
  const { data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // This `useEffect` runs when the transaction is successfully confirmed
  useEffect(() => {
    if (receipt) {
      console.log("Transaction confirmed!", receipt);
      const eventTopic = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');
      const log = receipt.logs.find(
        l => l.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      );
      if (log) {
        const decodedLog = decodeEventLog({ abi: [eventTopic], data: log.data, topics: log.topics });
        const tokenId = decodedLog.args.tokenId.toString();
        console.log("SUCCESS! New NFT minted with tokenId:", tokenId);
        setNewTokenId(tokenId);
        // Navigate to the gallery with the new ID
        navigate(`/gallery/${tokenId}`);
      } else {
        console.error("Could not find Transfer event in transaction receipt.");
        alert("Minting succeeded, but could not get Token ID. Please check your gallery manually.");
      }
    }
  }, [receipt, navigate]);

  // Update the loading state for the UI
  useEffect(() => {
    if (isPending) {
      setForgingStatus("CONFIRMING TRANSACTION...");
    } else if (isConfirming) {
      setForgingStatus("PROCESSING ON BLOCKCHAIN...");
    }
    
    setIsForging(isPending || isConfirming);
  }, [isPending, isConfirming]);

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
      setForgingStatus("FORGING...");
      // Don't navigate immediately, let the animation complete
       // Give time for the forging animation
    }
    
    if (writeError) {
      console.error("❌ Write contract error:", writeError);
      console.error("Error details:", {
        message: writeError.message,
        cause: writeError.cause,
        name: writeError.name,
      });
      setIsForging(false);
      setForgingStatus("FORGING...");
      alert(`Transaction Error: ${writeError.message}\n\nCheck console for details.`);
    }
    
    if (receiptError) {
      console.error("❌ Receipt error:", receiptError);
      setIsForging(false);
      setForgingStatus("FORGING...");
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

        {/* Pinata JWT Warning */}
        {PINATA_JWT === "YOUR_PINATA_JWT_HERE" && (
          <motion.div
            className="max-w-4xl mx-auto mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 text-center">
              <p className="text-red-200 font-medium mb-2">⚠️ Configuration Required</p>
              <p className="text-sm text-red-300">
                Please replace "YOUR_PINATA_JWT_HERE" with your actual Pinata JWT token to enable IPFS uploads.
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
                  {forgingStatus}
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

                {/* Show generated image preview */}
                {generatedImageUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-forge-neon-blue mb-2">Generated Image:</p>
                    <img 
                      src={generatedImageUrl} 
                      alt="Generated NFT" 
                      className="w-32 h-32 object-cover rounded-lg mx-auto border border-forge-neon-blue"
                    />
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
          
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-forge-neon-blue scrollbar-track-forge-border">
          {[...userNfts,...mockNFTs ].map((nft) => (
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
        isVisible={isForgingInProgress} 
        status={forgingStatus}
        onComplete={() => {
          if (isConfirmed && newTokenId) {
            setIsForging(false);
          }
        }}
        
      />
    </div>
  );
};

export default ForgePage;