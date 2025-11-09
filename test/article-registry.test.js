// article-registry.text.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function getArticleIdFromReceipt(receipt, registry) {
  for (const log of receipt.logs) {
    try {
      const parsed = registry.interface.parseLog(log);
      if (parsed.name === "ArticleSubmitted") {
        return parsed.args.id;
      }
    } catch { }
  }
  throw new Error("ArticleSubmitted event not found");
}

describe("ArticleRegistry", function () {
  let registry, staking, token;
  let deployer, ai, validator1, validator2, validator3;

beforeEach(async function () {
    [deployer, user, validator1, validator2, validator3, ai] = await ethers.getSigners();

    // Deploy NewsToken with name and symbol
    const NewsToken = await ethers.getContractFactory("NewsToken");
    token = await NewsToken.deploy("News Token", "NEWS");
    await token.waitForDeployment();

    // Deploy ValidatorStaking with token address
    const ValidatorStaking = await ethers.getContractFactory("ValidatorStaking");
    staking = await ValidatorStaking.deploy(await token.getAddress());
    await staking.waitForDeployment();

    // Deploy ArticleRegistry with staking address
    const ArticleRegistry = await ethers.getContractFactory("ArticleRegistry");
    registry = await ArticleRegistry.deploy(await staking.getAddress());
    await registry.waitForDeployment();

    // Grant roles
    const ADMIN_ROLE = await staking.ADMIN_ROLE();
    await staking.grantRole(ADMIN_ROLE, await registry.getAddress());

    const AI_ROLE = await registry.AI_ROLE();
    await registry.grantRole(AI_ROLE, ai.address);
  });


  it("submits and auto-approves article with high trust score", async function () {
    const tx = await registry
      .connect(deployer)
      .submitArticle("cid123", ethers.keccak256(ethers.toUtf8Bytes("Hello")));
    const receipt = await tx.wait();
    const id = await getArticleIdFromReceipt(receipt, registry);

    await registry.connect(ai).setAIScore(id, 90);
    const article = await registry.getArticle(id);

    // ✅ auto-approved => Published (status = 5)
    expect(article.status).to.equal(5);
  });

  it("submits and goes through validator voting", async function () {
    const tx = await registry
      .connect(deployer)
      .submitArticle("cid456", ethers.keccak256(ethers.toUtf8Bytes("Hi")));
    const receipt = await tx.wait();
    const id = await getArticleIdFromReceipt(receipt, registry);

    await registry.connect(ai).setAIScore(id, 50);

    // Assuming validators need to stake first
    const STAKE_AMOUNT = ethers.parseEther("100"); // Example stake amount

    // Mint tokens to validators
    await token.connect(deployer).mint(validator1.address, STAKE_AMOUNT);
    await token.connect(deployer).mint(validator2.address, STAKE_AMOUNT);
    await token.connect(deployer).mint(validator3.address, STAKE_AMOUNT);

    // Validators approve staking contract and stake
    await token.connect(validator1).approve(await staking.getAddress(), STAKE_AMOUNT);
    await staking.connect(validator1).stake(STAKE_AMOUNT);

    await token.connect(validator2).approve(await staking.getAddress(), STAKE_AMOUNT);
    await staking.connect(validator2).stake(STAKE_AMOUNT);

    await token.connect(validator3).approve(await staking.getAddress(), STAKE_AMOUNT);
    await staking.connect(validator3).stake(STAKE_AMOUNT);

    await registry.connect(validator1).vote(id, true);
    await registry.connect(validator2).vote(id, true);
    await registry.connect(validator3).vote(id, false);

    const article = await registry.getArticle(id);

    // Your voting logic: 2 yes, 1 no. Total 3 votes. 2/3 = 66.6%.
    // Since your threshold is >= 75%, this article should be rejected (status = 4).
    expect(article.status).to.equal(4); // Rejected
  });
});