import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import AnimatedBackground from "@/components/AnimatedBackground";
import ForgeButton from "@/components/ForgeButton";

const PortalPage = () => {
  const navigate = useNavigate();

  const handleEnterForge = () => {
    navigate("/forge");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Header with Connect Wallet */}
      <header className="absolute top-0 w-full flex justify-between items-center p-6 z-50">
        <h1 className="font-orbitron text-forge-neon-blue text-2xl">ZetaForge</h1>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </header>

      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          className="text-center space-y-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Main Title */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            <h1 className="text-7xl md:text-8xl font-orbitron font-black text-glow-blue animate-neon-flicker">
              ZetaForge
            </h1>
            <motion.div
              className="h-1 bg-forge-gradient-primary mx-auto rounded"
              style={{ width: 200 }}
              initial={{ width: 0 }}
              animate={{ width: 200 }}
              transition={{ duration: 1.5, delay: 0.8 }}
            />
          </motion.div>

          {/* Subtitle */}
          <motion.h2
            className="text-2xl md:text-3xl font-space-grotesk font-light text-glow-purple"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            Fuse. Evolve. Create.
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-lg md:text-xl text-forge-text-secondary max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
          >
            Harness the power of AI to fuse NFTs from different blockchains.
            Create something entirely new in the ultimate cybernetic forge.
          </motion.p>

          {/* Call to Action */}
          <motion.div
            className="pt-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <ForgeButton
              variant="hero"
              onClick={handleEnterForge}
              className="text-xl px-12 py-6"
            >
              Enter the Forge
            </ForgeButton>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            {[
              {
                title: "Cross-Chain Fusion",
                description: "Merge NFTs from Ethereum, Polygon, and more",
                icon: "⚡",
              },
              {
                title: "AI-Powered Creation",
                description: "Describe your vision and watch it come to life",
                icon: "🧠",
              },
              {
                title: "Unique Artifacts",
                description: "Every creation is one-of-a-kind and yours",
                icon: "💎",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="forge-container text-center p-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.7 + index * 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-orbitron font-bold text-forge-neon-blue mb-2">
                  {feature.title}
                </h3>
                <p className="text-forge-text-muted text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-forge-neon-blue rounded-full flex justify-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-3 bg-forge-neon-blue rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default PortalPage;
