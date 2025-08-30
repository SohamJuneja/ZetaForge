import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Loader2 } from 'lucide-react';

interface ForgeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'hero' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

const ForgeButton = ({ 
  onClick, 
  disabled = false, 
  loading = false, 
  variant = 'default',
  children, 
  className = '' 
}: ForgeButtonProps) => {
  
  const getButtonClasses = () => {
    const base = 'relative font-orbitron font-bold text-lg px-8 py-4 rounded-lg transition-all duration-300 overflow-hidden';
    
    switch (variant) {
      case 'hero':
        return `${base} bg-forge-gradient-primary hover:bg-forge-gradient-primary 
                text-forge-void border-2 border-forge-neon-blue 
                shadow-neon-blue hover:shadow-neon-purple
                ${!disabled ? 'pulse-glow' : ''}`;
      
      case 'secondary':
        return `${base} bg-transparent border-2 border-forge-neon-purple 
                text-forge-neon-purple hover:bg-forge-neon-purple/10
                neon-glow-purple`;
      
      default:
        return `${base} bg-forge-surface border-2 border-forge-neon-blue 
                text-forge-neon-blue hover:bg-forge-neon-blue/10
                ${!disabled ? 'neon-glow-blue' : ''}`;
    }
  };

  const IconComponent = loading ? Loader2 : Zap;

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${getButtonClasses()} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Background animation */}
        {!disabled && (
          <motion.div
            className="absolute inset-0 bg-forge-gradient-primary opacity-0 hover:opacity-20"
            whileHover={{ opacity: 0.2 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Content */}
        <div className="relative flex items-center space-x-3 z-10">
          <IconComponent 
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
          />
          <span>{children}</span>
        </div>

        {/* Energy pulse effect */}
        {!disabled && !loading && variant === 'hero' && (
          <>
            <motion.div
              className="absolute inset-0 border-2 border-forge-neon-blue rounded-lg"
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-0 border-2 border-forge-neon-purple rounded-lg"
              animate={{
                opacity: [0, 0.6, 0],
                scale: [1.05, 0.95, 1.05],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default ForgeButton;