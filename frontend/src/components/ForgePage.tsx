import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AnimatedBackground from '@/components/AnimatedBackground';
import NFTSlot from '@/components/NFTSlot';
import ForgeButton from '@/components/ForgeButton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface NFT {
  id: string;
  name: string;
  image: string;
  chain: string;
}

// Mock NFT data
const mockNFTs: NFT[] = [
  {
    id: '1',
    name: 'Cyber Punk #1234',
    image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=400&fit=crop&crop=center',
    chain: 'Ethereum'
  },
  {
    id: '2',
    name: 'Digital Dragon #5678',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    chain: 'Polygon'
  },
  {
    id: '3',
    name: 'Neon Knight #9012',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop&crop=center',
    chain: 'Ethereum'
  },
  {
    id: '4',
    name: 'Cosmic Cat #3456',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=center',
    chain: 'BSC'
  }
];

const ForgingAnimation = ({ isVisible, onComplete }: { isVisible: boolean; onComplete: () => void }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <Dialog open={isVisible}>
          <DialogContent className="max-w-4xl w-full bg-forge-void/95 border-forge-neon-blue border-2">
            <div className="relative h-96 flex items-center justify-center overflow-hidden">
              <AnimatedBackground showIntense />
              
              {/* Central orb */}
              <motion.div
                className="absolute w-32 h-32 rounded-full bg-forge-gradient-primary"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1, 1.5, 1],
                  opacity: [0, 1, 1, 1, 0.8],
                }}
                transition={{ duration: 4, ease: "easeInOut" }}
                style={{
                  boxShadow: '0 0 100px hsl(193 100% 50% / 0.8), 0 0 200px hsl(262 100% 67% / 0.6)',
                }}
              />

              {/* Energy lines */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 bg-forge-neon-blue"
                  style={{
                    height: '200px',
                    transformOrigin: 'bottom',
                    rotate: i * 45,
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ 
                    scaleY: [0, 1, 0.8, 1.2, 0],
                    opacity: [0, 1, 0.8, 1, 0],
                  }}
                  transition={{ 
                    duration: 3,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                />
              ))}

              {/* Forge text */}
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

              {/* Complete and navigate */}
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
};

const ForgePage = () => {
  const navigate = useNavigate();
  const [selectedNFTs, setSelectedNFTs] = useState<(NFT | null)[]>([null, null]);
  const [prompt, setPrompt] = useState('');
  const [showNFTModal, setShowNFTModal] = useState<number | null>(null);
  const [isForging, setIsForging] = useState(false);

  const canForge = selectedNFTs.every(nft => nft !== null) && prompt.trim().length > 0;

  const handleNFTSelect = (nft: NFT) => {
    if (showNFTModal !== null) {
      const newSelectedNFTs = [...selectedNFTs];
      newSelectedNFTs[showNFTModal] = nft;
      setSelectedNFTs(newSelectedNFTs);
      setShowNFTModal(null);
    }
  };

  const handleForge = () => {
    if (canForge) {
      setIsForging(true);
    }
  };

  const handleForgingComplete = () => {
    setIsForging(false);
    navigate('/gallery');
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Header isConnected walletAddress="0x1234...5678" />
      
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
                    placeholder="Select NFT from Ethereum"
                    onClick={() => setShowNFTModal(0)}
                    isActive={showNFTModal === 0}
                  />
                  <p className="text-sm text-forge-text-muted">Primary Asset</p>
                </div>

                <div className="text-center space-y-4">
                  <NFTSlot
                    nft={selectedNFTs[1]}
                    placeholder="Select NFT from Polygon"
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
                  FORGE
                </ForgeButton>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* NFT Selection Modal */}
      <Dialog open={showNFTModal !== null} onOpenChange={() => setShowNFTModal(null)}>
        <DialogContent className="max-w-2xl bg-forge-surface border-forge-neon-blue border-2">
          <h3 className="text-xl font-orbitron font-bold text-forge-neon-blue mb-6">
            Select an NFT
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {mockNFTs.map((nft) => (
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
        isVisible={isForging} 
        onComplete={handleForgingComplete}
      />
    </div>
  );
};

export default ForgePage;