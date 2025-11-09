// deploy-news-token.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  const Token = await ethers.getContractFactory("NewsToken");

  // ✅ pass token name and symbol
  const token = await Token.deploy("NewsToken", "NEWS"); 
  await token.waitForDeployment();

  console.log("NewsToken deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
