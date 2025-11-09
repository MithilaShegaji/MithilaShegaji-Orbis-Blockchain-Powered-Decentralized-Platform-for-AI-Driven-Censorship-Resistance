const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Deploy NewsToken
  const NewsToken = await ethers.getContractFactory("NewsToken");
  const token = await NewsToken.deploy("News Token", "NEWS");
  await token.waitForDeployment();
  console.log("NewsToken deployed at:", await token.getAddress());

  // 2. Deploy ValidatorStaking with NewsToken address
  const ValidatorStaking = await ethers.getContractFactory("ValidatorStaking");
  const staking = await ValidatorStaking.deploy(await token.getAddress());
  await staking.waitForDeployment();
  console.log("ValidatorStaking deployed at:", await staking.getAddress());

  // 3. Deploy ArticleRegistry with staking address
  const ArticleRegistry = await ethers.getContractFactory("ArticleRegistry");
  const registry = await ArticleRegistry.deploy(await staking.getAddress());
  await registry.waitForDeployment();
  console.log("ArticleRegistry deployed at:", await registry.getAddress());

  // 4. Give ArticleRegistry ADMIN_ROLE in staking contract
  const ADMIN_ROLE = await staking.ADMIN_ROLE();
  await staking.grantRole(ADMIN_ROLE, await registry.getAddress());
  console.log("Granted ADMIN_ROLE to ArticleRegistry in ValidatorStaking");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
