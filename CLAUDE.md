# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orbis is a blockchain-based news platform with AI-powered content validation and a token-based validator staking system. The architecture consists of smart contracts, a Node.js API backend, and a React frontend.

## Project Structure

### Core Components
- **Smart Contracts** (`contracts/`): Three main contracts that form the platform's core
  - `NewsToken.sol`: ERC20 token for governance and staking rewards
  - `ValidatorStaking.sol`: Manages validator token staking with rewards/penalties
  - `ArticleRegistry.sol`: Handles article submissions, AI scoring, and validator voting
- **API Backend** (`api/`): Express.js server that bridges blockchain and frontend
- **Frontend** (`frontend/`): React + Vite application with Tailwind CSS
- **Deployment Scripts** (`scripts/`): Hardhat deployment and role management scripts

### Technology Stack
- **Blockchain**: Hardhat framework with Solidity 0.8.20, OpenZeppelin contracts
- **Backend**: Node.js with Express, ethers.js v6, MongoDB, Pinata IPFS
- **Frontend**: React 19, Vite 7, Tailwind CSS 4, ethers.js v6
- **External Services**: Google NLP API for sentiment analysis, Pinata for IPFS storage

## Common Development Commands

### Smart Contract Development
```bash
# Compile contracts
npx hardhat compile

# Deploy all contracts to Sepolia testnet
npx hardhat run scripts/deploy-all.js --network sepolia

# Deploy individual contracts
npx hardhat run scripts/deploy-news-token.js --network sepolia
npx hardhat run scripts/deploy-validator-staking.js --network sepolia
npx hardhat run scripts/deploy-article-registry.js --network sepolia

# Grant roles after deployment
npx hardhat run scripts/grantAdminRole.js --network sepolia
npx hardhat run scripts/grantMinterRole.js --network sepolia

# Run local Hardhat network
npx hardhat node
```

### Frontend Development
```bash
cd frontend/
npm run dev      # Start development server (Vite)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### API Backend
```bash
cd api/
npm start        # Start Express server (default port 4000)
```

## Architecture Flow

### Article Submission Process
1. **Frontend** submits article (title, content) to API
2. **API** uploads content to IPFS via Pinata, calls `ArticleRegistry.submitArticle()`
3. **Smart Contract** emits `ArticleSubmitted` event with new article ID
4. **API** automatically triggers AI scoring via Google NLP sentiment analysis
5. **AI Service** calls `ArticleRegistry.setAIScore()` with calculated trust score
6. **Smart Contract Logic**:
   - Trust score ≥80: Auto-approve and publish
   - Trust score <80: Send to validator review
7. **Validator Review** (if needed): Validators vote, requiring 75% consensus with minimum 3 votes

### Validator Staking System
- Validators must stake NEWS tokens to participate in voting
- Correct votes earn rewards (10 NEWS tokens)
- Incorrect votes result in penalties (5 NEWS tokens slashed)
- Article Registry contract has ADMIN_ROLE on Validator Staking contract

### Role-Based Access Control
- **ADMIN_ROLE**: Contract administration, role management
- **MINTER_ROLE**: Can mint NEWS tokens (typically API backend)
- **AI_ROLE**: Can set AI trust scores (typically API backend)

## Environment Configuration

### Required Environment Variables (.env)
```bash
# Blockchain
RPC_URL=                     # Sepolia testnet RPC URL
PRIVATE_KEY=                 # Deployer/API wallet private key
VALIDATOR_PRIVATE_KEY_1=     # Test validator 1
VALIDATOR_PRIVATE_KEY_2=     # Test validator 2

# Contract Addresses (set after deployment)
ARTICLE_REGISTRY_ADDRESS=
NEWS_TOKEN_ADDRESS=
VALIDATOR_STAKING_ADDRESS=

# External Services
GOOGLE_NLP_API_KEY=          # Google Cloud NLP API
PINATA_API_KEY=              # Pinata IPFS service
PINATA_SECRET_API_KEY=
PINATA_GATEWAY_URL=

# Database
MONGO_URI=                   # MongoDB connection string

# Server
PORT=4000                    # API server port
```

## Key Integration Points

### Contract Interaction Patterns
- Use ethers.js v6 with JsonRpcProvider for blockchain connections
- All contract interactions go through the API backend (never direct from frontend)
- Contract addresses and ABIs are centrally managed in `api/abis/`
- BigInt values from contracts require `.toString()` conversion for JSON serialization

### IPFS Content Storage
- Article content stored on IPFS via Pinata
- Content hash verification using `ethers.keccak256()`
- Gateway URLs constructed as `${PINATA_GATEWAY_URL}/ipfs/${cid}`

### Error Handling Patterns
- Contract reverts bubble up through API with specific error messages
- Frontend shows user-friendly error messages
- Comprehensive logging throughout the API layer

## Development Notes

### Smart Contract Deployment Order
1. Deploy NewsToken first (standalone)
2. Deploy ValidatorStaking with NewsToken address
3. Deploy ArticleRegistry with ValidatorStaking address
4. Grant ArticleRegistry ADMIN_ROLE on ValidatorStaking
5. Grant API wallet AI_ROLE and MINTER_ROLE

### Frontend-API Communication
- All API endpoints return JSON with consistent error structure
- Frontend uses axios for HTTP requests
- Real-time updates handled through polling (no WebSocket implementation)

### Testing Considerations
- Use Hardhat local network for development testing
- Sepolia testnet for integration testing
- No formal test suite implemented - manual testing through API endpoints
- Test validator accounts configured in API for automated testing

## Critical Dependencies
- `@openzeppelin/contracts`: Smart contract security and standards
- `ethers`: Blockchain interaction library
- `hardhat`: Development framework and testing
- `react` + `vite`: Modern frontend development
- `express`: API server framework
- `mongoose`: MongoDB ODM for caching

## Common Issues and Solutions

### API Timestamp Errors
The API endpoints for fetching articles expect the contract's `getArticle()` method to return data in this format:
`[id, author, ipfsCid, contentHash, trustScore, timestamp, status, yesVotes, noVotes, versionCount]`

Always validate timestamps before converting to Date objects to avoid "Invalid time value" errors.

### Contract Method Names
- Use `totalArticles()` not `articleCount()` to get the number of articles
- The `getArticle()` method returns a tuple with 10 fields, not the legacy format some endpoints expect