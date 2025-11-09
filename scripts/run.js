const hre = require("hardhat");

async function main() {
  // Take inputs from command line
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log("Usage: npx hardhat run --network sepolia scripts/run.js <registryAddress> <ipfsCid> <articleText>");
    return;
  }

  const [registryAddress, ipfsCid, articleText] = args;

  const [author, ai] = await hre.ethers.getSigners();
  const registry = await hre.ethers.getContractAt("ArticleRegistry", registryAddress);

  console.log("📡 Using ArticleRegistry:", registry.target); // use .target instead of .address in Hardhat v6

  // Hash the article text
  const hash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(articleText));

  // Submit article
  const tx = await registry.connect(author).submitArticle(ipfsCid, hash);
  const receipt = await tx.wait();

  // Ensure there's a log before accessing it
  if (!receipt || !receipt.logs || receipt.logs.length === 0) {
    throw new Error("No logs found in transaction receipt. Article submission might have failed or event not emitted.");
  }

  // Parse the event to get the article ID
  let id;
  try {
      const parsedLog = registry.interface.parseLog(receipt.logs[0]);
      if (parsedLog && parsedLog.name === "ArticleSubmitted") {
          id = parsedLog.args.id.toString();
      } else {
          throw new Error("ArticleSubmitted event not found in the first log.");
      }
  } catch (parseError) {
      // Fallback if parsing fails or event name doesn't match
      console.warn("Could not parse 'ArticleSubmitted' event from the first log. Attempting direct access.");
      // Assuming 'id' is the first arg in the event, if structure is known
      id = receipt.logs[0].args[0].toString();
  }
  
  console.log(`✅ Article submitted! ID: ${id}, TxHash: ${tx.hash}`);

  // Give AI_ROLE if needed
  const AI_ROLE = await registry.AI_ROLE();
  if (!(await registry.hasRole(AI_ROLE, ai.address))) {
    await (await registry.grantRole(AI_ROLE, ai.address)).wait();
    console.log(`🔑 AI_ROLE granted to: ${ai.address}`);
  }

  // Random AI score for demo
  const score = Math.floor(Math.random() * 100);
  await (await registry.connect(ai).setAIScore(id, score)).wait();
  console.log(`🤖 AI set trust score = ${score}`);

  const article = await registry.getArticle(id);

  console.log("📄 Article details:");

  // In ethers v6, article is both an array and object with keys
  // Based on your previous log output, the structure is:
  // [ articleId, authorAddress, ipfsCid, contentHash, status, trustScore, views, likes ]
  console.log(" Article ID:", article[0].toString());      // Should be BigInt
  console.log(" Author Address:", article[1]);             // Should be string address
  console.log(" IPFS CID:", article[2]);                   // Should be string
  console.log(" Content Hash:", article[3]);               // Should be bytes32 hash
  console.log(" Status:", article[4].toString(), "(0=submitted, 5=published, etc.)"); // Should be BigInt, convert to string
  console.log(" Trust Score:", article[5].toString());     // Should be BigInt, convert to string
  console.log(" Views:", article[6].toString());           // Should be BigInt, convert to string
  console.log(" Likes:", article[7].toString());           // Should be BigInt, convert to string

}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});