import { ethers } from "hardhat";

async function main() {
  const ZetaForge = await ethers.getContractFactory("ZetaForge");
  const zetaForge = await ZetaForge.deploy();

  await zetaForge.deployed();

  console.log("✅ ZetaForge deployed to:", zetaForge.address);
}

// Proper error handling
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
