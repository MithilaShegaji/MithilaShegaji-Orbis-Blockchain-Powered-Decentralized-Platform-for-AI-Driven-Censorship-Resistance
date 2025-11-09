// deploy-validator-staking.js
require('dotenv').config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  // Get NEWS token address from .env
  const newsTokenAddress = process.env.NEWS_TOKEN_ADDRESS;

  if (!newsTokenAddress) {
    throw new Error("NEWS_TOKEN_ADDRESS not found in .env file");
  }

  console.log("Using NewsToken at:", newsTokenAddress);

  const ValidatorStaking = await ethers.getContractFactory("ValidatorStaking");
  const staking = await ValidatorStaking.deploy(newsTokenAddress);
  await staking.waitForDeployment();

  const stakingAddress = await staking.getAddress();
  console.log("ValidatorStaking deployed to:", stakingAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
