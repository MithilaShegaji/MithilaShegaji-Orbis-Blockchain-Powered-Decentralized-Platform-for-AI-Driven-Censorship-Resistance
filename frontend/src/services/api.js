
import { ethers } from 'ethers';
import ArticleRegistryABI from '../artifacts/contracts/ArticleRegistry.sol/ArticleRegistry.json';

const API_BASE_URL = 'http://localhost:4000';
const ARTICLE_REGISTRY_ADDRESS = '0x4f142eAb49ce025ee2Cca86feb8210dfc07937Eb';

export const fetchArticles = async () => {
  const response = await fetch(`${API_BASE_URL}/articles`);
  if (!response.ok) throw new Error('Failed to fetch articles.');
  return await response.json();
};

export const submitArticle = async (title, content) => {
  const response = await fetch(`${API_BASE_URL}/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.details || 'Submission failed');
  return result;
};

export const readContent = async (cid) => {
  const response = await fetch(`${API_BASE_URL}/articles/content/${cid}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${response.status}`);
  }
  return await response.json();
};

export const voteOnArticle = async (articleId, decision, account) => {
  if (!account) {
    throw new Error("Please connect your wallet to vote.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const articleRegistry = new ethers.Contract(
    ARTICLE_REGISTRY_ADDRESS,
    ArticleRegistryABI.abi,
    signer
  );

  const articleIdBigInt = BigInt(articleId);
  const tx = await articleRegistry.vote(articleIdBigInt, decision);
  await tx.wait();
  return tx;
};

export const mintTokens = async () => {
  const apiWalletAddress = '0x12936e6Ba49Ba44aFcEf0EFd0af065f12eF40419';
  const response = await fetch(`${API_BASE_URL}/mint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: apiWalletAddress, amount: '1000' }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.details || 'Minting failed');
  return result;
};

export const stakeTokens = async (amount) => {
  const response = await fetch(`${API_BASE_URL}/stake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.details || 'Staking failed');
  return result;
};

// Validator Statistics APIs
export const getValidatorStats = async (address) => {
  const response = await fetch(`${API_BASE_URL}/validators/${address}`);
  if (!response.ok) throw new Error('Failed to fetch validator stats');
  return await response.json();
};

export const getLeaderboard = async (limit = 10) => {
  const response = await fetch(`${API_BASE_URL}/validators/leaderboard/top?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return await response.json();
};

export const getAllValidators = async (page = 1, limit = 20) => {
  const response = await fetch(`${API_BASE_URL}/validators?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch validators');
  return await response.json();
};

// Article Versioning APIs
export const proposeArticleUpdate = async (articleId, title, content) => {
  const response = await fetch(`${API_BASE_URL}/articles/${articleId}/propose-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.details || 'Failed to propose update');
  return result;
};

export const getVersionHistory = async (articleId) => {
  const response = await fetch(`${API_BASE_URL}/articles/${articleId}/versions`);
  if (!response.ok) throw new Error('Failed to fetch version history');
  return await response.json();
};

export const getSpecificVersion = async (articleId, versionIndex) => {
  const response = await fetch(`${API_BASE_URL}/articles/${articleId}/versions/${versionIndex}`);
  if (!response.ok) throw new Error('Failed to fetch version');
  return await response.json();
};

export const compareVersions = async (articleId, v1, v2) => {
  const response = await fetch(`${API_BASE_URL}/articles/${articleId}/compare?v1=${v1}&v2=${v2}`);
  if (!response.ok) throw new Error('Failed to compare versions');
  return await response.json();
};

export const getCurrentProposal = async (articleId) => {
  const response = await fetch(`${API_BASE_URL}/articles/${articleId}/proposals/current`);
  if (!response.ok) throw new Error('Failed to fetch current proposal');
  return await response.json();
};

export const voteOnUpdateProposal = async (articleId, proposalId, decision, account) => {
  if (!account) {
    throw new Error("Please connect your wallet to vote.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const articleRegistry = new ethers.Contract(
    ARTICLE_REGISTRY_ADDRESS,
    ArticleRegistryABI.abi,
    signer
  );

  const articleIdBigInt = BigInt(articleId);
  const proposalIdBigInt = BigInt(proposalId);
  const tx = await articleRegistry.voteOnUpdateProposal(articleIdBigInt, proposalIdBigInt, decision);
  await tx.wait();
  return tx;
};
