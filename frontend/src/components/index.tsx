import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface HeaderProps {
  isConnected?: boolean;
  walletAddress?: string;
  onConnect?: () => void;
}

const Header = ({ isConnected = false, walletAddress, onConnect }: HeaderProps) => {
  const truncateAddress = (address: string) => 
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-forge-void/80 backdrop-blur-md border-b border-forge-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-8 h-8 rounded bg-forge-gradient-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-forge-void" />
          </div>
          <h1 className="text-2xl font-orbitron font-bold text-glow-blue">
            ZetaForge
          </h1>
        </motion.div>

        {/* Connect Wallet Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onConnect}
            variant="outline"
            className={`
              relative px-6 py-2 font-space-grotesk font-medium
              bg-transparent border-2 border-forge-neon-blue/50 
              text-forge-neon-blue hover:bg-forge-neon-blue/10
              neon-glow-blue transition-all duration-300
              ${isConnected ? 'animate-forge-pulse' : ''}
            `}
          >
            {isConnected && walletAddress 
              ? truncateAddress(walletAddress)
              : 'Connect Wallet'
            }
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;