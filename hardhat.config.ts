import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";
import { HardhatUserConfig } from "hardhat/config"; // This line might be slightly different, that's okay

const config: HardhatUserConfig = {
  solidity: "0.8.26",
  networks: {
    // --- THIS IS THE NEW SECTION WE ARE ADDING ---
    athens3: {
      url: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      accounts: [process.env.PRIVATE_KEY!], // Uses the private key from your .env file
    },
    // ------------------------------------------
  },
};

export default config;