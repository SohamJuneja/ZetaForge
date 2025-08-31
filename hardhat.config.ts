import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      metadata: {
        // 👇 ensure solc emits metadata.json
        bytecodeHash: "ipfs",
      },
    },
  },
};

export default config;
