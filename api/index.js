import express from "express";
import cors from "cors";
import { ethers } from "ethers"; // This is the first declaration
import mongoose from "mongoose";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import articleRegistryAbi from "./abis/ArticleRegistry.json" assert { type: "json" };
import newsTokenAbi from "./abis/NewsToken.json" assert { type: "json" };
import validatorStakingAbi from "./abis/ValidatorStaking.json" assert { type: "json" };
import * as validatorTracker from "./utils/validatorTracker.js";
import AIAnalysis from "./models/AIAnalysis.js";
import Article from "./models/Article.js";

dotenv.config({ path: "../.env" });
console.log("DEBUG: Current Working Directory:", process.cwd());
console.log("DEBUG: Resolved .env path:", path.resolve(process.cwd(), '../.env'));
console.log("DEBUG: process.env.RPC_URL after dotenv.config:", process.env.RPC_URL);

const app = express();
app.use(express.json());
app.use(cors());

// ------------------- CONFIG -------------------
const rpcUrl = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const validatorPrivateKey1 = process.env.VALIDATOR_PRIVATE_KEY_1;
const validatorPrivateKey2 = process.env.VALIDATOR_PRIVATE_KEY_2;
const validatorPrivateKey3 = process.env.VALIDATOR_PRIVATE_KEY_3;
const validatorPrivateKey4 = process.env.VALIDATOR_PRIVATE_KEY_4;
const articleRegistryAddress = process.env.ARTICLE_REGISTRY_ADDRESS;
const newsTokenAddress = process.env.NEWS_TOKEN_ADDRESS;
const validatorStakingAddress = process.env.VALIDATOR_STAKING_ADDRESS;
const googleApiKey = process.env.GOOGLE_NLP_API_KEY;

// --- DEBUGGING LOGS ---
console.log("-----------------------------------------");
console.log("API Configuration Check:");
console.log("RPC_URL:", rpcUrl);
console.log("PRIVATE_KEY (first 5 chars):", privateKey ? privateKey.substring(0, 5) + "..." : "NOT SET");
console.log("ARTICLE_REGISTRY_ADDRESS:", articleRegistryAddress);
console.log("NEWS_TOKEN_ADDRESS:", newsTokenAddress);
console.log("VALIDATOR_STAKING_ADDRESS:", validatorStakingAddress);
console.log("GOOGLE_NLP_API_KEY:", googleApiKey ? "SET" : "NOT SET");
console.log("-----------------------------------------");
// --- END DEBUGGING LOGS ---

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const validatorWallet1 = new ethers.Wallet(validatorPrivateKey1, provider);
const validatorWallet2 = new ethers.Wallet(validatorPrivateKey2, provider);

// Initialize validator wallets array with existing wallets
const validatorWallets = [wallet, validatorWallet1, validatorWallet2];

// Add validators 3-4 if private keys exist
if (validatorPrivateKey3) {
  const validatorWallet3 = new ethers.Wallet(validatorPrivateKey3, provider);
  validatorWallets.push(validatorWallet3);
  console.log(`Added validator 3: ${validatorWallet3.address}`);
}

if (validatorPrivateKey4) {
  const validatorWallet4 = new ethers.Wallet(validatorPrivateKey4, provider);
  validatorWallets.push(validatorWallet4);
  console.log(`Added validator 4: ${validatorWallet4.address}`);
}

console.log(`Total validators configured: ${validatorWallets.length}`);

// Contract
if (!ethers.isAddress(articleRegistryAddress) || !ethers.isAddress(newsTokenAddress) || !ethers.isAddress(validatorStakingAddress)) {
    console.error("ERROR: Invalid contract address provided in .env!");
    process.exit(1);
}

const ArticleRegistry = new ethers.Contract(
  articleRegistryAddress,
  articleRegistryAbi.abi,
  wallet
);
const NewsToken = new ethers.Contract(newsTokenAddress, newsTokenAbi.abi, wallet);
const ValidatorStaking = new ethers.Contract(validatorStakingAddress, validatorStakingAbi.abi, wallet);


// Grant AI_ROLE to the API wallet if it doesn't have it
async function checkAndGrantAIRole() {
  try {
    const AI_ROLE = await ArticleRegistry.AI_ROLE();
    const hasRole = await ArticleRegistry.hasRole(AI_ROLE, wallet.address);
    if (!hasRole) {
      console.log(`Granting AI_ROLE to API wallet (${wallet.address})...`);
      const tx = await ArticleRegistry.grantRole(AI_ROLE, wallet.address);
      await tx.wait();
      console.log("AI_ROLE granted successfully.");
    } else {
      console.log("API wallet already has AI_ROLE.");
    }
  } catch (error) {
    console.error("Error in checkAndGrantAIRole:", error);
  }
}

checkAndGrantAIRole();

// MongoDB (for caching / fast search)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    // Start listening to contract events after DB connection
    setupEventListeners();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Setup event listeners for tracking validator performance
function setupEventListeners() {
  // Listen for ArticleSubmitted events to cache new articles
  ArticleRegistry.on("ArticleSubmitted", async (articleId, author, ipfsCid, contentHash, versionIndex, event) => {
    try {
      console.log(`📝 New article submitted: ID ${articleId}, Version ${versionIndex}`);

      // Check if article is already cached (from POST /articles endpoint)
      const existingArticle = await Article.findOne({ articleId: articleId.toString() });
      if (existingArticle) {
        console.log(`✓ Article ${articleId} already cached, skipping event listener cache`);
        return;
      }

      // Only fetch from IPFS if article wasn't cached by API endpoint
      console.log(`  📡 Article ${articleId} not in cache, fetching from IPFS...`);
      const ipfsContent = await fetchFromIPFS(ipfsCid);

      // Get full article data from blockchain
      const article = await ArticleRegistry.getArticle(articleId);

      // Cache to MongoDB
      const articleData = {
        author: article[1],
        ipfsCid: article[2],
        contentHash: article[3],
        trustScore: article[4],
        timestamp: article[5],
        status: article[6],
        yesVotes: article[7],
        noVotes: article[8],
        versionCount: article[9]
      };

      await cacheArticleToMongoDB(articleId, articleData, ipfsContent);
    } catch (error) {
      console.error(`Error caching article ${articleId}:`, error);
    }
  });

  // Listen for ArticleFinalized events to update cache
  ArticleRegistry.on("ArticleFinalized", async (articleId, status, event) => {
    try {
      console.log(`Article ${articleId} finalized with status ${status}`);

      // Update article status in cache
      await updateArticleInCache(articleId, { status: Number(status) });

      // Get article details to find validators who voted
      const article = await ArticleRegistry.getArticle(articleId);

      // Status: 5 = Published, 4 = Rejected
      const isPublished = Number(status) === 5;

      console.log(`Tracking outcome for article ${articleId}: ${isPublished ? 'Published' : 'Rejected'}`);
    } catch (error) {
      console.error('Error handling ArticleFinalized event:', error);
    }
  });

  // Listen for AIScored events to update trust score in cache
  ArticleRegistry.on("AIScored", async (articleId, trustScore, status, event) => {
    try {
      console.log(`Article ${articleId} AI scored: ${trustScore}, status: ${status}`);

      await updateArticleInCache(articleId, {
        trustScore: Number(trustScore),
        status: Number(status)
      });
    } catch (error) {
      console.error(`Error updating AI score for article ${articleId}:`, error);
    }
  });

  // Listen for Voted events to update vote counts in cache
  ArticleRegistry.on("Voted", async (articleId, validator, decision, event) => {
    try {
      console.log(`Validator ${validator} voted ${decision ? 'YES' : 'NO'} on article ${articleId}`);

      // Get updated article data to sync vote counts
      const article = await ArticleRegistry.getArticle(articleId);
      await updateArticleInCache(articleId, {
        yesVotes: Number(article[7]),
        noVotes: Number(article[8])
      });
    } catch (error) {
      console.error('Error handling Voted event:', error);
    }
  });

  // Listen for Rewarded events
  ValidatorStaking.on("Rewarded", async (validator, amount, event) => {
    try {
      console.log(`Validator ${validator} rewarded ${amount.toString()} tokens`);
      await validatorTracker.recordVoteOutcome(
        validator,
        true, // correct vote
        amount.toString(),
        '0'
      );
    } catch (error) {
      console.error('Error handling Rewarded event:', error);
    }
  });

  // Listen for Slashed events
  ValidatorStaking.on("Slashed", async (validator, amount, event) => {
    try {
      console.log(`Validator ${validator} slashed ${amount.toString()} tokens`);
      await validatorTracker.recordVoteOutcome(
        validator,
        false, // incorrect vote
        '0',
        amount.toString()
      );
    } catch (error) {
      console.error('Error handling Slashed event:', error);
    }
  });

  // Listen for Staked events to update validator stake
  ValidatorStaking.on("Staked", async (user, amount, event) => {
    try {
      const stakeBalance = await ValidatorStaking.stakedBalance(user);
      await validatorTracker.updateValidatorStake(user, stakeBalance.toString());
      console.log(`Validator ${user} staked ${amount.toString()} tokens. Total: ${stakeBalance.toString()}`);
    } catch (error) {
      console.error('Error handling Staked event:', error);
    }
  });

  // Listen for Unstaked events
  ValidatorStaking.on("Unstaked", async (user, amount, event) => {
    try {
      const stakeBalance = await ValidatorStaking.stakedBalance(user);
      await validatorTracker.updateValidatorStake(user, stakeBalance.toString());
      console.log(`Validator ${user} unstaked ${amount.toString()} tokens. Remaining: ${stakeBalance.toString()}`);
    } catch (error) {
      console.error('Error handling Unstaked event:', error);
    }
  });

  console.log("Event listeners set up successfully");
}

// ------------------- PINATA UPLOAD -------------------
async function uploadToPinata(content) {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
    },
    body: JSON.stringify(content),
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.IpfsHash; // CID
}

// ------------------- IPFS Content Fetching -------------------
async function fetchFromIPFS(cid) {
  const url = `${process.env.PINATA_GATEWAY_URL}/ipfs/${cid}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // { title, content }
  } catch (error) {
    console.error(`Error fetching CID ${cid} from IPFS:`, error);
    return { title: '[Content Unavailable]', content: 'Unable to fetch content from IPFS' };
  }
}

// ------------------- Article Caching Functions -------------------
async function cacheArticleToMongoDB(articleId, articleData, ipfsContent) {
  try {
    const article = {
      articleId: articleId.toString(),
      author: articleData.author,
      title: ipfsContent.title || `Article #${articleId}`,
      content: ipfsContent.content || '',
      ipfsCid: articleData.ipfsCid,
      contentHash: articleData.contentHash,
      trustScore: Number(articleData.trustScore || 0),
      status: Number(articleData.status || 0),
      timestamp: new Date(Number(articleData.timestamp) * 1000),
      yesVotes: Number(articleData.yesVotes || 0),
      noVotes: Number(articleData.noVotes || 0),
      versionCount: Number(articleData.versionCount || 1),
      versions: [{
        versionIndex: 0,
        ipfsCid: articleData.ipfsCid,
        contentHash: articleData.contentHash,
        title: ipfsContent.title,
        content: ipfsContent.content,
        timestamp: new Date(Number(articleData.timestamp) * 1000)
      }],
      lastSyncedFromBlockchain: new Date()
    };

    await Article.findOneAndUpdate(
      { articleId: articleId.toString() },
      article,
      { upsert: true, new: true }
    );

    console.log(`✓ Article ${articleId} cached to MongoDB`);
    return true;
  } catch (error) {
    console.error(`Failed to cache article ${articleId} to MongoDB:`, error);
    return false;
  }
}

async function updateArticleInCache(articleId, updates) {
  try {
    await Article.findOneAndUpdate(
      { articleId: articleId.toString() },
      { ...updates, lastSyncedFromBlockchain: new Date() },
      { new: true }
    );
    console.log(`✓ Article ${articleId} updated in cache`);
  } catch (error) {
    console.error(`Failed to update article ${articleId} in cache:`, error);
  }
}

// ------------------- Helper function for BigInt serialization -------------------
function bigIntReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString(); // Convert BigInt to string
  }
  return value; // Return other values unchanged
}

// ------------------- FAKE NEWS DETECTION API -------------------
// Analyze article content using the Fake News Detection microservice
async function analyzeFakeNews(text) {
  const fakeNewsApiUrl = process.env.FAKE_NEWS_API_URL || "http://localhost:5000";
  const url = `${fakeNewsApiUrl}/analyze`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Fake News API request failed: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in analyzeFakeNews:", error);
    throw error;
  }
}

// LEGACY: Google NLP sentiment analysis (kept as fallback)
async function analyzeSentiment(text) {
  const url = `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${googleApiKey}`;
  const body = {
    document: {
      content: text,
      type: "PLAIN_TEXT",
    },
    encodingType: "UTF8",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Google NLP API request failed: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const data = await response.json();
    return data.documentSentiment;
  } catch (error) {
    console.error("Error in analyzeSentiment:", error);
    throw error;
  }
}

// Score article and submit to the smart contract
async function scoreArticle(articleId, content) {
  console.log(`AI scoring started for article ID: ${articleId}...`);
  try {
    // Use Fake News Detection API
    const analysis = await analyzeFakeNews(content);

    const trustScore = analysis.trustScore;
    const consensus = analysis.consensus;

    console.log(`Fake News Detection Results for article ${articleId}:`);
    console.log(`  Consensus: ${consensus}`);
    console.log(`  Trust Score: ${trustScore}`);
    console.log(`  Auto-Publish: ${analysis.autoPublish ? 'YES (≥80)' : 'NO - Validators Required (<80)'}`);
    console.log(`  Models used: ${analysis.totalModels}`);
    console.log(`  Model results:`, JSON.stringify(analysis.results, null, 2));

    // Store detailed AI analysis in MongoDB for frontend visualization
    try {
      // Transform analysis results into model predictions
      // analysis.results is an object like { "LightGBM": { confidence: 99.99, label: "FAKE" }, ... }
      const modelPredictions = Object.entries(analysis.results).map(([modelName, result]) => ({
        name: modelName,
        prediction: result.label || consensus,
        confidence: typeof result.confidence === 'number'
          ? result.confidence
          : trustScore // fallback to trust score
      }));

      const aiAnalysisDoc = new AIAnalysis({
        articleId: articleId.toString(),
        trustScore: trustScore,
        consensus: consensus,
        autoPublish: analysis.autoPublish,
        totalModels: analysis.totalModels,
        models: modelPredictions
      });

      await aiAnalysisDoc.save();
      console.log(`✓ AI analysis stored in MongoDB for article ${articleId}`);
    } catch (dbError) {
      console.error(`Warning: Failed to store AI analysis in MongoDB:`, dbError);
      // Don't fail the entire scoring process if DB storage fails
    }

    console.log(`Submitting AI score ${trustScore} for article ${articleId} to blockchain...`);

    const tx = await ArticleRegistry.setAIScore(
      articleId,
      trustScore,
      {
        // Optional: specify gas limit if transactions are failing
        // gasLimit: 300000,
      }
    );

    await tx.wait();
    console.log(`AI score submitted for article ${articleId}. Tx: ${tx.hash}`);
    console.log(`Result: ${analysis.autoPublish ? '✓ Auto-published' : '⟳ Sent to validator voting'}`);
  } catch (error) {
    console.error(`Failed to score article ${articleId}:`, error);
    console.log(`Falling back to Google NLP sentiment analysis...`);

    // Fallback to Google NLP
    try {
      if (!googleApiKey) {
        console.error('Google NLP API key not configured. Scoring failed completely.');
        return;
      }

      const sentiment = await analyzeSentiment(content);
      const sentimentScore = sentiment.score; // Range: -1 to 1
      const magnitude = sentiment.magnitude;

      // Convert sentiment to trust score (0-100)
      // Positive sentiment = higher trust, negative = lower trust
      // Score of -1 to 1 mapped to 0-100
      let trustScore = Math.round(((sentimentScore + 1) / 2) * 100);

      // Cap at reasonable bounds
      trustScore = Math.max(0, Math.min(100, trustScore));

      console.log(`Google NLP Sentiment Analysis for article ${articleId}:`);
      console.log(`  Sentiment Score: ${sentimentScore} (range: -1 to 1)`);
      console.log(`  Magnitude: ${magnitude}`);
      console.log(`  Converted Trust Score: ${trustScore}`);
      console.log(`  Auto-Publish: ${trustScore >= 80 ? 'YES (≥80)' : 'NO - Validators Required (<80)'}`);

      // Store basic AI analysis in MongoDB
      try {
        const aiAnalysisDoc = new AIAnalysis({
          articleId: articleId.toString(),
          trustScore: trustScore,
          consensus: trustScore >= 80 ? 'REAL' : 'FAKE',
          autoPublish: trustScore >= 80,
          totalModels: 1,
          models: [{
            name: 'Google NLP Sentiment',
            prediction: trustScore >= 80 ? 'REAL' : 'FAKE',
            confidence: trustScore
          }]
        });
        await aiAnalysisDoc.save();
        console.log(`✓ Google NLP analysis stored in MongoDB for article ${articleId}`);
      } catch (dbError) {
        console.error(`Warning: Failed to store AI analysis in MongoDB:`, dbError);
      }

      // Submit to blockchain
      console.log(`Submitting Google NLP score ${trustScore} for article ${articleId} to blockchain...`);
      const tx = await ArticleRegistry.setAIScore(articleId, trustScore);
      await tx.wait();
      console.log(`AI score submitted for article ${articleId}. Tx: ${tx.hash}`);
      console.log(`Result: ${trustScore >= 80 ? '✓ Auto-published' : '⟳ Sent to validator voting'}`);
    } catch (fallbackError) {
      console.error(`Fallback Google NLP also failed:`, fallbackError);
      console.error(`Article ${articleId} remains unscored. Use manual scoring endpoint: POST /articles/${articleId}/score`);
    }
  }
}

// ------------------- ROUTES -------------------

// health check
app.get("/health", (req, res) => res.send("API alive"));

// submit article
app.post("/articles", async (req, res) => {
  try {
    const { title, content } = req.body;

    const cid = await uploadToPinata({ title, content });

    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

    console.log(`Submitting article "${title}" to ArticleRegistry...`);
    const tx = await ArticleRegistry.submitArticle(cid, contentHash);
    const receipt = await tx.wait();
    console.log(`Article submitted. Transaction hash: ${receipt.hash}`);

    let articleId;
    console.log(`Transaction receipt has ${receipt.logs.length} logs`);

    for (const log of receipt.logs) {
        try {
            const parsed = ArticleRegistry.interface.parseLog(log);
            console.log(`Parsed event: ${parsed.name}`);
            if (parsed.name === "ArticleSubmitted") {
                articleId = parsed.args.id.toString();
                console.log(`New Article ID: ${articleId}`);
                break;
            }
        } catch (e) {
            console.log(`Failed to parse log:`, e.message);
        }
    }

    if (!articleId) {
        console.error("Could not extract article ID from transaction logs!");
    }

    if (articleId) {
      // Cache article to MongoDB immediately
      try {
        const article = await ArticleRegistry.getArticle(BigInt(articleId));
        const articleData = {
          author: article[1],
          ipfsCid: article[2],
          contentHash: article[3],
          trustScore: article[4],
          timestamp: article[5],
          status: article[6],
          yesVotes: article[7],
          noVotes: article[8],
          versionCount: article[9]
        };

        await cacheArticleToMongoDB(articleId, articleData, { title, content });
        console.log(`✓ Article ${articleId} cached to MongoDB`);
      } catch (cacheError) {
        console.error(`Warning: Failed to cache article ${articleId}:`, cacheError);
        // Don't fail the request if caching fails
      }

      // Call scoring asynchronously but don't wait for it
      scoreArticle(articleId, content).catch(error => {
        console.error(`Failed to score article ${articleId}:`, error);
      });
    }

    res.json({ cid, txHash: tx.hash, articleId: articleId || "unknown" });
  } catch (err) {
    console.error("Error in /articles POST:", err);
    res.status(500).send("Error submitting article");
  }
});

// get all articles (from MongoDB cache with blockchain fallback)
app.get("/articles", async (req, res) => {
  console.log("Received request for all articles.");
  try {
    // Try MongoDB first (fast!)
    let articles = await Article.find()
      .sort({ timestamp: -1 }) // Newest first
      .lean(); // Convert to plain JavaScript objects

    // Add AI analysis details to each article
    for (let article of articles) {
      try {
        const aiAnalysis = await AIAnalysis.findOne({ articleId: article.articleId });
        if (aiAnalysis) {
          article.aiDetails = {
            models: aiAnalysis.models,
            totalModels: aiAnalysis.totalModels,
            consensus: aiAnalysis.consensus,
            autoPublish: aiAnalysis.autoPublish
          };
        }
      } catch (err) {
        // Ignore AI analysis fetch errors
      }

      // Format for frontend compatibility
      article.id = article.articleId;
      article.trustScore = article.trustScore.toString();
      article.status = article.status.toString();
      article.yesVotes = article.yesVotes.toString();
      article.noVotes = article.noVotes.toString();
      article.versionCount = article.versionCount.toString();
      article.timestamp = article.timestamp.toISOString();
    }

    console.log(`✓ Served ${articles.length} articles from MongoDB cache`);
    res.json(articles);

  } catch (err) {
    console.error("Error fetching articles from MongoDB, falling back to blockchain:", err);

    // Fallback to blockchain if MongoDB fails
    try {
      const articleCount = await ArticleRegistry.totalArticles();
      console.log("Fetching", articleCount.toString(), "articles from blockchain...");
      const articles = [];

      for (let i = 1; i <= articleCount; i++) {
        const article = await ArticleRegistry.getArticle(i);
        const timestamp = Number(article[5]);
        const isValidTimestamp = timestamp > 0 && timestamp < (Date.now() / 1000) + 86400;

        // Get AI analysis details from MongoDB if available
        let aiDetails = null;
        try {
          const aiAnalysis = await AIAnalysis.findOne({ articleId: i.toString() });
          if (aiAnalysis) {
            aiDetails = {
              models: aiAnalysis.models,
              totalModels: aiAnalysis.totalModels,
              consensus: aiAnalysis.consensus,
              autoPublish: aiAnalysis.autoPublish
            };
          }
        } catch (err) {
          // Ignore
        }

        articles.push({
          id: i.toString(),
          author: article[1],
          ipfsCid: article[2],
          contentHash: article[3],
          trustScore: article[4].toString(),
          timestamp: isValidTimestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
          status: article[6].toString(),
          yesVotes: article[7].toString(),
          noVotes: article[8].toString(),
          versionCount: article[9].toString(),
          aiDetails: aiDetails,
          title: `Article #${i}`, // Placeholder, no IPFS content in fallback mode
          content: '' // Placeholder
        });
      }

      console.log("Sending", articles.length, "articles from blockchain fallback.");
      res.json(articles);
    } catch (blockchainErr) {
      console.error("Blockchain fallback also failed:", blockchainErr);
      res.status(500).json({ error: "Error fetching articles", details: blockchainErr.message });
    }
  }
});

// get article details (from chain)
app.get("/articles/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Fetching article ID: ${id} from ArticleRegistry at ${articleRegistryAddress}...`);

    const article = await ArticleRegistry.getArticle(BigInt(id));

    console.log("Received article data:", article);

    // Contract returns: [id, author, ipfsCid, contentHash, trustScore, timestamp, status, yesVotes, noVotes, versionCount]
    const timestamp = Number(article[5]);
    const isValidTimestamp = timestamp > 0 && timestamp < (Date.now() / 1000) + 86400;

    // Get AI analysis details from MongoDB if available
    let aiDetails = null;
    try {
      const aiAnalysis = await AIAnalysis.findOne({ articleId: id });
      if (aiAnalysis) {
        aiDetails = {
          models: aiAnalysis.models,
          totalModels: aiAnalysis.totalModels,
          consensus: aiAnalysis.consensus,
          autoPublish: aiAnalysis.autoPublish
        };
      }
    } catch (err) {
      console.log(`No AI analysis found for article ${id}:`, err.message);
    }

    const articleData = {
        id: id,
        author: article[1],
        ipfsCid: article[2],
        contentHash: article[3],
        trustScore: article[4].toString(),
        timestamp: isValidTimestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
        status: article[6].toString(),
        yesVotes: article[7].toString(),
        noVotes: article[8].toString(),
        versionCount: article[9].toString(),
        aiDetails: aiDetails
    };

    res.json(articleData);

  } catch (err) {
    console.error(`Error fetching article ID ${req.params.id}:`, err);
    res.status(500).json({ error: "Error fetching article", details: err.message });
  }
});

// get article content (from IPFS)
app.get("/articles/content/:cid", async (req, res) => {
  const { cid } = req.params;
  const url = `${process.env.PINATA_GATEWAY_URL}/ipfs/${cid}`;
  console.log(`Fetching content for CID: ${cid} from ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pinata gateway returned an error: ${response.status} ${response.statusText}`);
      console.error(`Response body: ${errorText}`);
      throw new Error(`Failed to fetch from Pinata Gateway. Status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      console.error(`Received non-JSON response from gateway for CID ${cid}.`);
      console.error("Raw response body:", text);
      throw new Error("Gateway did not return JSON content.");
    }

  } catch (err) {
    if (err instanceof SyntaxError) {
        console.error(`Error parsing JSON response from Pinata for CID ${cid}. The gateway may have returned non-JSON content (e.g., an HTML error page).`);
    }
    console.error(`Error fetching content for CID ${cid}:`, err.message);
    res.status(500).json({ error: "Error fetching article content from IPFS." });
  }
});

// Vote on an article as a specific validator (for testing)
app.post("/articles/:id/vote-validator", async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, validatorIndex } = req.body;

    if (typeof decision !== 'boolean') {
      return res.status(400).json({ error: "Invalid 'decision' field. Must be true or false." });
    }

    if (validatorIndex < 0 || validatorIndex >= validatorWallets.length) {
      return res.status(400).json({ error: `Invalid validatorIndex. Must be 0-${validatorWallets.length - 1}` });
    }

    const validatorWallet = validatorWallets[validatorIndex];
    console.log(`Processing vote for article ID: ${id}, Decision: ${decision}, Validator ${validatorIndex} (${validatorWallet.address})`);

    // Create contract instance with the specific validator wallet
    const ArticleRegistryAsValidator = new ethers.Contract(
      articleRegistryAddress,
      articleRegistryAbi.abi,
      validatorWallet
    );

    const tx = await ArticleRegistryAsValidator.vote(id, decision);
    const receipt = await tx.wait();

    console.log(`Vote submitted by validator ${validatorIndex}. Transaction hash: ${receipt.hash}`);

    // Track the vote in database
    await validatorTracker.recordVote(validatorWallet.address, id);

    res.json({
      txHash: receipt.hash,
      validator: validatorWallet.address,
      validatorIndex: validatorIndex,
      decision: decision
    });

  } catch (err) {
    console.error(`Error processing vote for article ID ${req.params.id}:`, err);

    // Check for specific contract revert reasons
    if (err.code === 'CALL_EXCEPTION' && err.reason) {
        if (err.reason.includes('Already voted')) {
            return res.status(409).json({
              error: "Already voted",
              details: `Validator ${req.body.validatorIndex} has already voted on this article.`
            });
        }
        if (err.reason.includes('Must stake first')) {
            return res.status(403).json({
              error: "Must stake first",
              details: `Validator ${req.body.validatorIndex} must stake NEWS tokens before voting.`
            });
        }
    }

    // Generic error for other cases
    res.status(500).json({ error: "Error processing vote", details: err.reason || err.message });
  }
});

// Vote on an article (original endpoint)
app.post("/articles/:id/vote", async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    if (typeof decision !== 'boolean') {
      return res.status(400).json({ error: "Invalid 'decision' field. Must be true or false." });
    }

    console.log(`Processing vote for article ID: ${id}, Decision: ${decision}`);

    const tx = await ArticleRegistry.vote(id, decision);
    const receipt = await tx.wait();

    console.log(`Vote submitted. Transaction hash: ${receipt.hash}`);
    res.json({ txHash: receipt.hash });

  } catch (err) {
    console.error(`Error processing vote for article ID ${req.params.id}:`, err);

    // Check for specific contract revert reasons
    if (err.code === 'CALL_EXCEPTION' && err.reason) {
        if (err.reason.includes('Already voted')) {
            return res.status(409).json({ error: "Conflict", details: "The voter has already cast a vote on this article." });
        }
        // Add other specific checks here if needed
        // if (err.reason.includes('Voting period is over')) {
        //     return res.status(403).json({ error: "Forbidden", details: "The voting period for this article has ended." });
        // }
    }

    // Generic error for other cases
    res.status(500).json({ error: "Error processing vote", details: err.reason || err.message });
  }
});

// Mint NewsToken to the API's own wallet (for testing/staking)
app.post("/mint", async (req, res) => {
  try {
    const { amount } = req.body;
    const parsedAmount = ethers.parseEther(amount); // e.g., amount "100" -> 100e18

    console.log(`Minting ${amount} NEWS to wallet ${wallet.address}...`);

    const MINTER_ROLE = await NewsToken.MINTER_ROLE();
    const hasRole = await NewsToken.hasRole(MINTER_ROLE, wallet.address);
    if (!hasRole) {
      console.log("API wallet does not have MINTER_ROLE. Granting it now...");
      const grantRoleTx = await NewsToken.grantRole(MINTER_ROLE, wallet.address);
      await grantRoleTx.wait();
      console.log("MINTER_ROLE granted.");
    }

    const tx = await NewsToken.mint(wallet.address, parsedAmount);
    const receipt = await tx.wait();

    console.log(`Mint successful. Transaction hash: ${receipt.hash}`);
    res.json({ txHash: receipt.hash, amount: amount });

  } catch (err) {
    console.error(`Error minting tokens:`, err);
    res.status(500).json({ error: "Error minting tokens", details: err.reason || err.message });
  }
});


// Mint NewsToken for a specific validator
app.post("/mint-validator", async (req, res) => {
  try {
    const { amount, validatorIndex } = req.body;

    if (validatorIndex < 0 || validatorIndex >= validatorWallets.length) {
      return res.status(400).json({ error: `Invalid validatorIndex. Must be 0-${validatorWallets.length - 1}` });
    }

    const validatorWallet = validatorWallets[validatorIndex];
    const parsedAmount = ethers.parseEther(amount);

    console.log(`Minting ${amount} NEWS for validator ${validatorIndex} (${validatorWallet.address})...`);

    // Check if main wallet has MINTER_ROLE
    const MINTER_ROLE = await NewsToken.MINTER_ROLE();
    const hasRole = await NewsToken.hasRole(MINTER_ROLE, wallet.address);
    if (!hasRole) {
      console.log("API wallet does not have MINTER_ROLE. Granting it now...");
      const grantRoleTx = await NewsToken.grantRole(MINTER_ROLE, wallet.address);
      await grantRoleTx.wait();
      console.log("MINTER_ROLE granted.");
    }

    // Mint to the specific validator
    const tx = await NewsToken.mint(validatorWallet.address, parsedAmount);
    const receipt = await tx.wait();

    console.log(`Mint successful for validator ${validatorIndex}. Transaction hash: ${receipt.hash}`);
    res.json({
      txHash: receipt.hash,
      amount: amount,
      validator: validatorWallet.address,
      validatorIndex: validatorIndex
    });

  } catch (err) {
    console.error(`Error minting tokens for validator:`, err);
    res.status(500).json({ error: "Error minting tokens", details: err.reason || err.message });
  }
});

// Stake NewsToken for a specific validator
app.post("/stake-validator", async (req, res) => {
  try {
    const { amount, validatorIndex } = req.body;

    if (validatorIndex < 0 || validatorIndex >= validatorWallets.length) {
      return res.status(400).json({ error: `Invalid validatorIndex. Must be 0-${validatorWallets.length - 1}` });
    }

    const validatorWallet = validatorWallets[validatorIndex];
    const parsedAmount = ethers.parseEther(amount);

    console.log(`Staking ${amount} NEWS for validator ${validatorIndex} (${validatorWallet.address})...`);

    // Create contract instances with the specific validator wallet
    const NewsTokenAsValidator = new ethers.Contract(newsTokenAddress, newsTokenAbi.abi, validatorWallet);
    const ValidatorStakingAsValidator = new ethers.Contract(validatorStakingAddress, validatorStakingAbi.abi, validatorWallet);

    // Step 1: Approve the ValidatorStaking contract to spend tokens
    console.log(`Approving staking contract for validator ${validatorIndex}...`);
    const approveTx = await NewsTokenAsValidator.approve(validatorStakingAddress, parsedAmount);
    const approveReceipt = await approveTx.wait();
    console.log(`Approval successful for validator ${validatorIndex}. Transaction hash: ${approveReceipt.hash}`);

    // Step 2: Call the stake function
    console.log(`Calling stake function for validator ${validatorIndex}...`);
    const stakeTx = await ValidatorStakingAsValidator.stake(parsedAmount);
    const stakeReceipt = await stakeTx.wait();
    console.log(`Staking successful for validator ${validatorIndex}. Transaction hash: ${stakeReceipt.hash}`);

    res.json({
      approveTx: approveReceipt.hash,
      stakeTx: stakeReceipt.hash,
      validator: validatorWallet.address,
      validatorIndex: validatorIndex,
      amount: amount
    });

  } catch (err) {
    console.error(`Error staking tokens for validator:`, err);
    res.status(500).json({ error: "Error staking tokens", details: err.reason || err.message });
  }
});

// Stake NewsToken (original endpoint)
app.post("/stake", async (req, res) => {
  try {
    const { amount } = req.body;
    const parsedAmount = ethers.parseEther(amount);

    console.log(`Staking ${amount} NEWS for wallet ${wallet.address}...`);

    // Step 1: Approve the ValidatorStaking contract to spend tokens
    console.log(`Approving staking contract (${validatorStakingAddress}) to spend ${amount} NEWS...`);
    const approveTx = await NewsToken.approve(validatorStakingAddress, parsedAmount);
    const approveReceipt = await approveTx.wait();
    console.log(`Approval successful. Transaction hash: ${approveReceipt.hash}`);

    // Step 2: Call the stake function
    console.log(`Calling stake function...`);
    const stakeTx = await ValidatorStaking.stake(parsedAmount);
    const stakeReceipt = await stakeTx.wait();
    console.log(`Staking successful. Transaction hash: ${stakeReceipt.hash}`);

    res.json({ approveTx: approveReceipt.hash, stakeTx: stakeReceipt.hash });

  } catch (err) {
    console.error(`Error staking tokens:`, err);
    res.status(500).json({ error: "Error staking tokens", details: err.reason || err.message });
  }
});


// Fund validators with ETH for gas fees
app.post("/fund-validators", async (req, res) => {
  try {
    const { amount } = req.body; // ETH amount (e.g., "0.01")
    const ethAmount = ethers.parseEther(amount);

    console.log(`Sending ${amount} ETH to each validator for gas fees...`);

    const results = [];

    // Send ETH to validators 1-4 (skip index 0 which is main wallet)
    for (let i = 1; i < validatorWallets.length; i++) {
      const validatorAddress = validatorWallets[i].address;

      console.log(`Sending ${amount} ETH to validator ${i} (${validatorAddress})...`);

      const tx = await wallet.sendTransaction({
        to: validatorAddress,
        value: ethAmount
      });

      const receipt = await tx.wait();
      console.log(`ETH sent to validator ${i}. Transaction hash: ${receipt.hash}`);

      results.push({
        validatorIndex: i,
        validatorAddress: validatorAddress,
        amount: amount,
        txHash: receipt.hash
      });
    }

    res.json({
      message: `Successfully sent ${amount} ETH to ${results.length} validators`,
      transactions: results
    });

  } catch (err) {
    console.error(`Error funding validators:`, err);
    res.status(500).json({ error: "Error funding validators", details: err.reason || err.message });
  }
});

// Manual scoring endpoint for testing
app.post("/articles/:id/score", async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body; // Optional manual score, otherwise use Google NLP

    console.log(`Manual scoring request for article ${id}...`);

    if (score) {
      // Use provided score
      const tx = await ArticleRegistry.setAIScore(id, score);
      await tx.wait();
      console.log(`Manual score ${score} set for article ${id}. Tx: ${tx.hash}`);
      res.json({ txHash: tx.hash, score: score, method: 'manual' });
    } else {
      // Use Google NLP scoring
      const article = await ArticleRegistry.getArticle(BigInt(id));
      const ipfsCid = article[2];

      // Fetch content from IPFS
      const contentResponse = await fetch(`${process.env.PINATA_GATEWAY_URL}/ipfs/${ipfsCid}`);
      const contentData = await contentResponse.json();

      await scoreArticle(id, contentData.content);
      res.json({ message: `AI scoring triggered for article ${id}` });
    }

  } catch (err) {
    console.error(`Error scoring article ${req.params.id}:`, err);
    res.status(500).json({ error: "Error scoring article", details: err.reason || err.message });
  }
});

// ------------------- ARTICLE VERSIONING ENDPOINTS -------------------

// Propose an article update (author only)
app.post("/articles/:id/propose-update", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    console.log(`Proposing update for article ${id}...`);

    // Upload new content to IPFS
    const cid = await uploadToPinata({ title, content });
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

    // Propose update on-chain
    const tx = await ArticleRegistry.proposeArticleUpdate(id, cid, contentHash);
    const receipt = await tx.wait();

    console.log(`Update proposed for article ${id}. Transaction hash: ${receipt.hash}`);

    // Extract proposal ID from event
    let proposalId;
    for (const log of receipt.logs) {
      try {
        const parsed = ArticleRegistry.interface.parseLog(log);
        if (parsed.name === "ArticleUpdateProposed") {
          proposalId = parsed.args.proposalId.toString();
          console.log(`New Proposal ID: ${proposalId}`);
          break;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (proposalId) {
      // Trigger AI scoring for the update proposal
      scoreUpdateProposal(id, proposalId, content).catch(error => {
        console.error(`Failed to score update proposal ${proposalId}:`, error);
      });
    }

    res.json({
      txHash: tx.hash,
      proposalId: proposalId || "unknown",
      cid: cid
    });

  } catch (err) {
    console.error(`Error proposing update for article ${req.params.id}:`, err);
    res.status(500).json({ error: "Error proposing update", details: err.reason || err.message });
  }
});

// Score update proposal (similar to scoreArticle)
async function scoreUpdateProposal(articleId, proposalId, content) {
  console.log(`AI scoring started for update proposal ${proposalId} of article ${articleId}...`);
  try {
    const analysis = await analyzeFakeNews(content);
    const trustScore = analysis.trustScore;

    console.log(`Trust score for update proposal ${proposalId}: ${trustScore}`);

    const tx = await ArticleRegistry.setUpdateProposalAIScore(
      articleId,
      proposalId,
      trustScore
    );

    await tx.wait();
    console.log(`AI score submitted for update proposal ${proposalId}. Result: ${analysis.autoPublish ? 'Auto-approved' : 'Sent to validators'}`);
  } catch (error) {
    console.error(`Failed to score update proposal ${proposalId}:`, error);
    console.log(`Falling back to Google NLP sentiment analysis...`);

    // Fallback to Google NLP
    try {
      if (!googleApiKey) {
        console.error('Google NLP API key not configured. Scoring failed completely.');
        return;
      }

      const sentiment = await analyzeSentiment(content);
      const sentimentScore = sentiment.score;
      let trustScore = Math.round(((sentimentScore + 1) / 2) * 100);
      trustScore = Math.max(0, Math.min(100, trustScore));

      console.log(`Google NLP score for update proposal ${proposalId}: ${trustScore}`);

      const tx = await ArticleRegistry.setUpdateProposalAIScore(articleId, proposalId, trustScore);
      await tx.wait();
      console.log(`AI score submitted for update proposal ${proposalId}. Result: ${trustScore >= 80 ? 'Auto-approved' : 'Sent to validators'}`);
    } catch (fallbackError) {
      console.error(`Fallback Google NLP also failed for update proposal ${proposalId}:`, fallbackError);
    }
  }
}

// Vote on an update proposal
app.post("/articles/:id/proposals/:proposalId/vote", async (req, res) => {
  try {
    const { id, proposalId } = req.params;
    const { decision, validatorIndex } = req.body;

    if (typeof decision !== 'boolean') {
      return res.status(400).json({ error: "Invalid 'decision' field. Must be true or false." });
    }

    const validatorWallet = validatorIndex !== undefined && validatorIndex >= 0 && validatorIndex < validatorWallets.length
      ? validatorWallets[validatorIndex]
      : wallet;

    console.log(`Processing vote on update proposal ${proposalId} for article ${id}, Decision: ${decision}`);

    const ArticleRegistryAsValidator = new ethers.Contract(
      articleRegistryAddress,
      articleRegistryAbi.abi,
      validatorWallet
    );

    const tx = await ArticleRegistryAsValidator.voteOnUpdateProposal(id, proposalId, decision);
    const receipt = await tx.wait();

    console.log(`Vote submitted on update proposal. Transaction hash: ${receipt.hash}`);

    res.json({
      txHash: receipt.hash,
      validator: validatorWallet.address,
      decision: decision
    });

  } catch (err) {
    console.error(`Error voting on update proposal:`, err);
    res.status(500).json({ error: "Error voting on update proposal", details: err.reason || err.message });
  }
});

// Get version history for an article
app.get("/articles/:id/versions", async (req, res) => {
  try {
    const { id } = req.params;
    const article = await ArticleRegistry.getArticle(BigInt(id));
    const versionCount = Number(article[9]);

    const versions = [];
    for (let i = 0; i < versionCount; i++) {
      const version = await ArticleRegistry.getArticleVersion(id, i);
      versions.push({
        versionIndex: i,
        ipfsCid: version[0],
        contentHash: version[1],
        timestamp: new Date(Number(version[2]) * 1000).toISOString()
      });
    }

    res.json({
      articleId: id,
      totalVersions: versionCount,
      versions: versions
    });

  } catch (err) {
    console.error(`Error fetching version history for article ${req.params.id}:`, err);
    res.status(500).json({ error: "Error fetching version history", details: err.message });
  }
});

// Get specific version content
app.get("/articles/:id/versions/:versionIndex", async (req, res) => {
  try {
    const { id, versionIndex } = req.params;
    const version = await ArticleRegistry.getArticleVersion(id, versionIndex);

    const ipfsCid = version[0];
    const contentHash = version[1];
    const timestamp = Number(version[2]);

    // Fetch content from IPFS
    const contentResponse = await fetch(`${process.env.PINATA_GATEWAY_URL}/ipfs/${ipfsCid}`);
    const contentData = await contentResponse.json();

    res.json({
      versionIndex: versionIndex,
      ipfsCid: ipfsCid,
      contentHash: contentHash,
      timestamp: new Date(timestamp * 1000).toISOString(),
      content: contentData
    });

  } catch (err) {
    console.error(`Error fetching version ${req.params.versionIndex} of article ${req.params.id}:`, err);
    res.status(500).json({ error: "Error fetching version", details: err.message });
  }
});

// Compare two versions
app.get("/articles/:id/compare", async (req, res) => {
  try {
    const { id } = req.params;
    const { v1, v2 } = req.query;

    if (v1 === undefined || v2 === undefined) {
      return res.status(400).json({ error: "Both v1 and v2 query parameters required" });
    }

    const version1 = await ArticleRegistry.getArticleVersion(id, v1);
    const version2 = await ArticleRegistry.getArticleVersion(id, v2);

    // Fetch content from IPFS
    const content1Response = await fetch(`${process.env.PINATA_GATEWAY_URL}/ipfs/${version1[0]}`);
    const content1 = await content1Response.json();

    const content2Response = await fetch(`${process.env.PINATA_GATEWAY_URL}/ipfs/${version2[0]}`);
    const content2 = await content2Response.json();

    res.json({
      articleId: id,
      version1: {
        versionIndex: v1,
        ipfsCid: version1[0],
        timestamp: new Date(Number(version1[2]) * 1000).toISOString(),
        content: content1
      },
      version2: {
        versionIndex: v2,
        ipfsCid: version2[0],
        timestamp: new Date(Number(version2[2]) * 1000).toISOString(),
        content: content2
      }
    });

  } catch (err) {
    console.error(`Error comparing versions for article ${req.params.id}:`, err);
    res.status(500).json({ error: "Error comparing versions", details: err.message });
  }
});

// Get current/pending update proposal for an article
app.get("/articles/:id/proposals/current", async (req, res) => {
  try {
    const { id } = req.params;
    const currentProposalId = await ArticleRegistry.getCurrentProposalId(id);

    if (currentProposalId === 0n || currentProposalId === "0") {
      return res.json({ hasProposal: false, message: "No update proposals for this article" });
    }

    const proposal = await ArticleRegistry.getUpdateProposal(id, currentProposalId);

    res.json({
      hasProposal: true,
      proposalId: proposal[0].toString(),
      newIpfsCid: proposal[1],
      newContentHash: proposal[2],
      proposer: proposal[3],
      yesVotes: proposal[4].toString(),
      noVotes: proposal[5].toString(),
      status: proposal[6].toString(),
      createdAt: new Date(Number(proposal[7]) * 1000).toISOString()
    });

  } catch (err) {
    console.error(`Error fetching current proposal for article ${req.params.id}:`, err);
    res.status(500).json({ error: "Error fetching proposal", details: err.message });
  }
});

// Get specific update proposal details
app.get("/articles/:id/proposals/:proposalId", async (req, res) => {
  try {
    const { id, proposalId } = req.params;
    const proposal = await ArticleRegistry.getUpdateProposal(id, proposalId);

    res.json({
      proposalId: proposal[0].toString(),
      newIpfsCid: proposal[1],
      newContentHash: proposal[2],
      proposer: proposal[3],
      yesVotes: proposal[4].toString(),
      noVotes: proposal[5].toString(),
      status: proposal[6].toString(),
      createdAt: new Date(Number(proposal[7]) * 1000).toISOString()
    });

  } catch (err) {
    console.error(`Error fetching proposal ${req.params.proposalId} for article ${req.params.id}:`, err);
    res.status(500).json({ error: "Error fetching proposal", details: err.message });
  }
});

// ------------------- VALIDATOR STATS ENDPOINTS -------------------

// Get validator profile by address
app.get('/validators/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const stats = await validatorTracker.getValidatorStats(address);

    // Get current stake from contract
    const stakeBalance = await ValidatorStaking.stakedBalance(address);
    await validatorTracker.updateValidatorStake(address, stakeBalance.toString());

    // Get updated stats with rating
    const updatedStats = await validatorTracker.getValidatorStats(address);

    res.json(updatedStats);
  } catch (err) {
    console.error('Error fetching validator stats:', err);
    res.status(500).json({ error: 'Error fetching validator stats', details: err.message });
  }
});

// Get leaderboard (top validators)
app.get('/validators/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topValidators = await validatorTracker.getTopValidators(limit);

    res.json(topValidators);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Error fetching leaderboard', details: err.message });
  }
});

// Get all validators with pagination
app.get('/validators', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await validatorTracker.getAllValidators(page, limit);

    res.json(result);
  } catch (err) {
    console.error('Error fetching validators:', err);
    res.status(500).json({ error: 'Error fetching validators', details: err.message });
  }
});

// Recalculate all validator ratings (admin endpoint)
app.post('/validators/recalculate-ratings', async (req, res) => {
  try {
    const count = await validatorTracker.recalculateAllRatings();
    res.json({ message: `Successfully recalculated ratings for ${count} validators` });
  } catch (err) {
    console.error('Error recalculating ratings:', err);
    res.status(500).json({ error: 'Error recalculating ratings', details: err.message });
  }
});

// ------------------- START -------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));