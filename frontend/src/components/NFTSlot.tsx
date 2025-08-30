import { motion } from 'framer-motion';
import { Plus, Image } from 'lucide-react';

interface NFT {
  id: string;
  name: string;
  image: string;
  chain: string;
}

interface NFTSlotProps {
  nft?: NFT;
  placeholder: string;
  onClick: () => void;
  isActive?: boolean;
}

const NFTSlot = ({ nft, placeholder, onClick, isActive = false }: NFTSlotProps) => {
  return (
    <motion.div
      className="relative group cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className={`
        hex-slot w-40 h-40 relative overflow-hidden
        ${isActive ? 'active' : ''}
        ${nft ? 'border-forge-neon-blue' : 'border-forge-border'}
        hover:border-forge-neon-blue
        transition-all duration-300
      `}>
        {nft ? (
          <motion.div
            className="w-full h-full relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src={nft.image} 
              alt={nft.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forge-void/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 text-center">
              <p className="text-xs font-medium text-forge-text-primary truncate">
                {nft.name}
              </p>
              <p className="text-xs text-forge-neon-blue">
                {nft.chain}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-2 group-hover:text-forge-neon-blue transition-colors">
            <Plus className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="text-sm font-medium text-center px-2 text-forge-text-muted group-hover:text-forge-neon-blue">
              {placeholder}
            </p>
          </div>
        )}
      </div>

      {/* Glow effect overlay */}
      {(nft || isActive) && (
        <motion.div
          className="absolute inset-0 hex-slot border-2 border-forge-neon-blue opacity-0 group-hover:opacity-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: isActive ? 0.7 : 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            filter: 'blur(4px)',
            background: 'transparent',
          }}
        />
      )}

      {/* Selection indicator */}
      {nft && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-forge-neon-blue flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Image className="w-3 h-3 text-forge-void" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default NFTSlot;