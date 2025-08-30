import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Share2, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import AnimatedBackground from '@/components/AnimatedBackground';
import ForgeButton from '@/components/ForgeButton';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';



// Mock data for the newly created NFT
const newCreation = {
  id: 'zeta-001',
  name: 'Cybernetic Phoenix Dragon',
  image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop&crop=center',
  description: 'A majestic fusion of cyber punk aesthetics and mythical dragon power',
  traits: [
    { trait: 'Element', value: 'Cyber-Fire' },
    { trait: 'Rarity', value: 'Legendary' },
    { trait: 'Power Level', value: '9000' },
    { trait: 'Generation', value: 'Genesis' }
  ]
};

// Mock past creations



const pastCreations = [
  {
    id: 'zeta-002',
    name: 'Neon Samurai Cat',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop&crop=center',
  },
  {
    id: 'zeta-003', 
    name: 'Digital Storm Warrior',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=300&fit=crop&crop=center',
  },
  {
    id: 'zeta-004',
    name: 'Cosmic Punk Rider',
    image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=300&fit=crop&crop=center',
  },
  {
    id: 'zeta-005',
    name: 'Ethereal Circuit Phoenix',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop&crop=center',
  }
];

const GalleryPage = () => {
  const navigate = useNavigate();

  const handleViewOnZetaScan = () => {
    window.open('https://zetachain.blockscout.com/', '_blank');
  };

  const handleShareOnX = () => {
    const text = `Just forged "${newCreation.name}" on @ZetaForge! 🔥⚡ #ZetaForge #NFT #Web3`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleForgeAnother = () => {
    navigate('/forge');
  };

  const handleBackToPortal = () => {
    navigate('/');
  };
  const { address, isConnected } = useAccount();


  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Header isConnected={isConnected} walletAddress={address || ""} />

      
      <main className="container mx-auto px-6 pt-24 pb-12">
        {/* Back button */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            onClick={handleBackToPortal}
            variant="ghost"
            className="text-forge-neon-blue hover:bg-forge-neon-blue/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal
          </Button>
        </motion.div>

        {/* Success message */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-glow-blue mb-4">
            Forge Complete!
          </h1>
          <p className="text-xl text-forge-text-secondary">
            Your creation has been forged and minted successfully
          </p>
        </motion.div>

        {/* Main NFT Display */}
        <motion.div
          className="max-w-4xl mx-auto mb-16"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="forge-container-glow p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* NFT Image */}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="aspect-square rounded-lg overflow-hidden neon-glow-blue">
                  <img 
                    src={newCreation.image} 
                    alt={newCreation.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <motion.div
                  className="absolute -top-4 -right-4 bg-forge-gradient-primary px-4 py-2 rounded-full"
                  initial={{ rotate: -15, scale: 0 }}
                  animate={{ rotate: -15, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <span className="text-forge-void font-bold">NEW!</span>
                </motion.div>
              </motion.div>

              {/* NFT Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-orbitron font-bold text-forge-neon-blue mb-2">
                    {newCreation.name}
                  </h2>
                  <p className="text-forge-text-secondary">
                    ZetaForge Creation #{newCreation.id}
                  </p>
                </div>

                <p className="text-forge-text-muted leading-relaxed">
                  {newCreation.description}
                </p>

                {/* Traits */}
                <div className="space-y-3">
                  <h3 className="font-orbitron font-semibold text-forge-neon-purple">
                    Traits
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {newCreation.traits.map((trait, index) => (
                      <motion.div
                        key={trait.trait}
                        className="bg-forge-surface border border-forge-border rounded-lg p-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        <p className="text-xs text-forge-text-muted mb-1">
                          {trait.trait}
                        </p>
                        <p className="font-medium text-forge-text-primary">
                          {trait.value}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleViewOnZetaScan}
                    variant="outline"
                    className="flex-1 bg-transparent border-forge-neon-blue text-forge-neon-blue 
                              hover:bg-forge-neon-blue/10 neon-glow-blue"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on ZetaScan
                  </Button>
                  
                  <Button
                    onClick={handleShareOnX}
                    variant="outline"
                    className="flex-1 bg-transparent border-forge-neon-purple text-forge-neon-purple 
                              hover:bg-forge-neon-purple/10 neon-glow-purple"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on X
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Past Creations */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-orbitron font-bold text-center text-forge-neon-purple mb-8">
            Your Collection
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            {pastCreations.map((creation, index) => (
              <motion.div
                key={creation.id}
                className="forge-container p-4 hover:bg-forge-border/30 transition-colors cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-3">
                  <img 
                    src={creation.image} 
                    alt={creation.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-forge-text-primary text-sm truncate">
                  {creation.name}
                </h3>
                <p className="text-xs text-forge-text-muted">
                  #{creation.id}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Forge Another Button */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <ForgeButton
            variant="hero"
            onClick={handleForgeAnother}
            className="text-xl px-12 py-6"
          >
            Forge Another
          </ForgeButton>
        </motion.div>
      </main>
    </div>
  );
};

export default GalleryPage;
