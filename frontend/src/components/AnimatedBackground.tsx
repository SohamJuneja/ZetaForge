import { motion } from 'framer-motion';

const FloatingParticles = () => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 8,
    delay: Math.random() * 5,
  }));

  return (
    <div className="particles">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const CircuitLines = () => {
  return (
    <div className="absolute inset-0 opacity-20">
      <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(193 100% 50%)" stopOpacity="0.5" />
            <stop offset="50%" stopColor="hsl(262 100% 67%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(193 100% 50%)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        
        <motion.path
          d="M0,200 Q400,100 800,200 T1600,200 Q1800,250 1920,200"
          stroke="url(#circuit-gradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
        
        <motion.path
          d="M0,600 Q300,500 600,600 T1200,600 Q1500,650 1920,600"
          stroke="url(#circuit-gradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 3, delay: 1, ease: "easeInOut" }}
        />
        
        <motion.path
          d="M200,0 Q300,200 400,400 T600,800 Q700,1000 800,1080"
          stroke="url(#circuit-gradient)"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 4, delay: 0.5, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
};

interface AnimatedBackgroundProps {
  showIntense?: boolean;
}

const AnimatedBackground = ({ showIntense = false }: AnimatedBackgroundProps) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base nebula background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(216 47% 5%) 0%, hsl(216 35% 8%) 50%, hsl(216 47% 5%) 100%)',
        }}
        initial={{ scale: 1.1, opacity: 0.7 }}
        animate={{ 
          scale: showIntense ? 1.05 : 1.1, 
          opacity: showIntense ? 0.9 : 0.7 
        }}
        transition={{ duration: 8, ease: "easeInOut" }}
      />
      
      {/* Circuit pattern overlay */}
      <div className="absolute inset-0 circuit-bg opacity-30" />
      
      {/* Animated circuit lines */}
      <CircuitLines />
      
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-forge-void/60 via-transparent to-forge-void/60" />
      <div className="absolute inset-0 bg-forge-gradient-glow opacity-20" />
      
      {/* Intense mode overlay for forging animation */}
      {showIntense && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-forge-neon-blue/5 animate-pulse" />
          <div className="absolute inset-0 bg-forge-neon-purple/5 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </motion.div>
      )}
    </div>
  );
};

export default AnimatedBackground;