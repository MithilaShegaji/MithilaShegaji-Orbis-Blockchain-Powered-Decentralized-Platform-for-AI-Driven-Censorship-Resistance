const { ethers } = require("hardhat");
require('dotenv').config({ path: '../.env' });

async function main() {
  const newsTokenAddress = process.env.NEWS_TOKEN_ADDRESS;
  const apiWalletAddress = "0x12936e6Ba49Ba44aFcEf0EFd0af065f12eF40419"; // The address from the API's private key

  if (!newsTokenAddress || !apiWalletAddress) {
    console.error("Please make sure NEWS_TOKEN_ADDRESS is set in your .env file.");
    process.exit(1);
  }

  console.log(`Connecting to NewsToken at: ${newsTokenAddress}`);
  const NewsToken = await ethers.getContractAt("NewsToken", newsTokenAddress);

  const MINTER_ROLE = await NewsToken.MINTER_ROLE();

  console.log(`Granting MINTER_ROLE to API wallet: ${apiWalletAddress}...`);
  const tx = await NewsToken.grantRole(MINTER_ROLE, apiWalletAddress);
  await tx.wait();

  console.log("MINTER_ROLE granted successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
