// deploy-article-registry.js
require('dotenv').config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  // Get ValidatorStaking address from .env
  const stakingAddress = process.env.VALIDATOR_STAKING_ADDRESS;

  if (!stakingAddress) {
    throw new Error("VALIDATOR_STAKING_ADDRESS not found in .env file");
  }

  console.log("Using ValidatorStaking at:", stakingAddress);

  const ArticleRegistry = await ethers.getContractFactory("ArticleRegistry");
  const registry = await ArticleRegistry.deploy(stakingAddress);
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("ArticleRegistry deployed to:", registryAddress);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
