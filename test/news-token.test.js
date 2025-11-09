// news-token.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NewsToken", function () {
  it("deploys and allows MINTER to mint and non-minter cannot", async function () {
    const [deployer, other] = await ethers.getSigners();
    const NewsToken = await ethers.getContractFactory("NewsToken", deployer);
    const token = await NewsToken.deploy("News Token", "NEWS");
    await token.waitForDeployment();

    const MINTER_ROLE = await token.MINTER_ROLE();

    expect(await token.hasRole(MINTER_ROLE, deployer.address)).to.equal(true);

    await token.mint(other.address, ethers.parseUnits("10", 18));
    expect(await token.balanceOf(other.address)).to.equal(
      ethers.parseUnits("10", 18)
    );

    // old OZ uses revert strings
    await expect(
      token.connect(other).mint(other.address, ethers.parseUnits("5", 18))
    ).to.be.revertedWith(
      `AccessControl: account ${other.address.toLowerCase()} is missing role ${MINTER_ROLE}`
    );
  });
});
