import { ethers } from 'ethers';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Article from './models/Article.js';
import articleRegistryAbi from './abis/ArticleRegistry.json' assert { type: 'json' };

dotenv.config({ path: '../.env' });

const rpcUrl = process.env.RPC_URL;
const articleRegistryAddress = process.env.ARTICLE_REGISTRY_ADDRESS;

console.log('===========================================');
console.log('Article Sync Script');
console.log('===========================================');
console.log('RPC URL:', rpcUrl);
console.log('Article Registry:', articleRegistryAddress);
console.log('MongoDB URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
console.log('===========================================\n');

// Fetch content from IPFS
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
    console.error(`  ❌ Error fetching CID ${cid} from IPFS:`, error.message);
    return { title: '[Content Unavailable]', content: 'Unable to fetch content from IPFS' };
  }
}

// Cache article to MongoDB
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

    return true;
  } catch (error) {
    console.error(`  ❌ Failed to cache article ${articleId}:`, error.message);
    return false;
  }
}

// Main sync function
async function syncArticlesFromBlockchain() {
  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB connected\n');

    // Connect to blockchain
    console.log('⛓️  Connecting to blockchain...');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const ArticleRegistry = new ethers.Contract(
      articleRegistryAddress,
      articleRegistryAbi.abi,
      provider
    );
    console.log('✓ Blockchain connected\n');

    // Get total articles
    const totalArticles = await ArticleRegistry.totalArticles();
    console.log(`📊 Total articles on blockchain: ${totalArticles.toString()}\n`);

    if (totalArticles === 0n) {
      console.log('⚠️  No articles found on blockchain. Nothing to sync.');
      return;
    }

    console.log('🔄 Starting sync...\n');

    let successCount = 0;
    let errorCount = 0;

    // Sync each article
    for (let i = 1; i <= totalArticles; i++) {
      try {
        console.log(`[${i}/${totalArticles}] Syncing article ${i}...`);

        // Fetch from blockchain
        const article = await ArticleRegistry.getArticle(BigInt(i));

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

        // Fetch IPFS content
        console.log(`  📡 Fetching content from IPFS: ${articleData.ipfsCid.substring(0, 10)}...`);
        const ipfsContent = await fetchFromIPFS(articleData.ipfsCid);

        // Cache to MongoDB
        console.log(`  💾 Caching to MongoDB...`);
        const success = await cacheArticleToMongoDB(i, articleData, ipfsContent);

        if (success) {
          console.log(`  ✓ Article ${i} synced: "${ipfsContent.title}"\n`);
          successCount++;
        } else {
          errorCount++;
        }

      } catch (error) {
        console.error(`  ❌ Error syncing article ${i}:`, error.message, '\n');
        errorCount++;
      }
    }

    // Summary
    console.log('===========================================');
    console.log('Sync Complete!');
    console.log('===========================================');
    console.log(`✓ Successfully synced: ${successCount} articles`);
    console.log(`❌ Errors: ${errorCount} articles`);
    console.log(`📊 Total processed: ${totalArticles.toString()} articles`);
    console.log('===========================================');

  } catch (error) {
    console.error('Fatal error during sync:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n✓ MongoDB connection closed');
    process.exit(0);
  }
}

// Run the sync
syncArticlesFromBlockchain();
