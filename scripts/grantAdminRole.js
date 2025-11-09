const { ethers } = require("hardhat");
require('dotenv').config({ path: '../.env' });

async function main() {
  const articleRegistryAddress = process.env.ARTICLE_REGISTRY_ADDRESS;
  const apiWalletAddress = "0x12936e6Ba49Ba44aFcEf0EFd0af065f12eF40419"; // The address from the API's private key

  if (!articleRegistryAddress) {
    console.error("Please make sure ARTICLE_REGISTRY_ADDRESS is set in your .env file.");
    process.exit(1);
  }

  console.log(`Connecting to ArticleRegistry at: ${articleRegistryAddress}`);
  const ArticleRegistry = await ethers.getContractAt("ArticleRegistry", articleRegistryAddress);

  const ADMIN_ROLE = await ArticleRegistry.ADMIN_ROLE();

  console.log(`Granting ADMIN_ROLE to API wallet: ${apiWalletAddress}...`);
  const tx = await ArticleRegistry.grantRole(ADMIN_ROLE, apiWalletAddress);
  await tx.wait();

  console.log("ADMIN_ROLE granted successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
