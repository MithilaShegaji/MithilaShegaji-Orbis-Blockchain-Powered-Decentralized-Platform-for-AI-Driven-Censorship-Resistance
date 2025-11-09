//validator-staking.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ValidatorStaking", function () {
  let deployer, user;
  let token, staking;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    const NewsToken = await ethers.getContractFactory("NewsToken");
    token = await NewsToken.deploy("News Token", "NEWS");
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    const ValidatorStaking = await ethers.getContractFactory("ValidatorStaking");
    staking = await ValidatorStaking.deploy(tokenAddress);
    await staking.waitForDeployment();

    // Mint tokens for user
    await token.mint(user.address, ethers.parseUnits("100", 18));
  });

  it("allows user to stake and unstake", async function () {
    const amount = ethers.parseUnits("50", 18);

    await token.connect(user).approve(await staking.getAddress(), amount);

    await staking.connect(user).stake(amount);
    expect(await staking.stakedBalance(user.address)).to.equal(amount);

    await staking.connect(user).unstake(amount);
    expect(await staking.stakedBalance(user.address)).to.equal(0);
  });
});
