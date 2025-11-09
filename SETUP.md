# Orbis - Complete Setup Guide

This guide will help you set up the Orbis platform from scratch after downloading the repository.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://www.python.org/)
- **MongoDB** (Community Edition) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **MetaMask** browser extension - [Install](https://metamask.io/)

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/MithilaShegaji/MithilaShegaji-Orbis-Blockchain-Powered-Decentralized-Platform-for-AI-Driven-Censorship-Resistance.git
cd Orbis-Blockchain-Powered-Decentralized-Platform-for-AI-Driven-Censorship-Resistance

# Install root dependencies (Hardhat)
npm install

# Install API dependencies
cd api
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install AI service dependencies
cd Fake_News_Detection-main
pip install -r requirements.txt
cd ..
```

## Step 2: Get API Keys and Services

### 2.1 Alchemy RPC URL (Ethereum Sepolia Testnet)
1. Go to [Alchemy](https://www.alchemy.com/)
2. Create a free account
3. Create a new app on **Sepolia Testnet**
4. Copy the HTTPS URL (looks like: `https://eth-sepolia.g.alchemy.com/v2/...`)

### 2.2 Pinata (IPFS Storage)
1. Go to [Pinata](https://www.pinata.cloud/)
2. Create a free account
3. Go to **API Keys** → **New Key**
4. Enable all permissions
5. Copy the **API Key** and **API Secret**

### 2.3 Google Cloud NLP API (Optional - for AI fallback)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Cloud Natural Language API**
4. Create credentials → **API Key**
5. Copy the API key

### 2.4 Get Test ETH (Sepolia Testnet)
1. Create a wallet in MetaMask
2. Switch to **Sepolia Test Network**
3. Get free test ETH from:
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
4. Copy your wallet's **private key** (MetaMask → Account Details → Export Private Key)

⚠️ **WARNING:** Never use a wallet with real funds for development!

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Open `.env` in a text editor and fill in your values:
```env
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_wallet_private_key_from_metamask

PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
PINATA_GATEWAY_URL=https://gateway.pinata.cloud

GOOGLE_NLP_API_KEY=your_google_api_key

MONGO_URI=mongodb://localhost:27017/Orbis
PORT=4000
```

## Step 4: Deploy Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy all contracts to Sepolia testnet
npx hardhat run scripts/deploy-all.js --network sepolia

# The script will output contract addresses - copy them to .env:
# ARTICLE_REGISTRY_ADDRESS=0x...
# NEWS_TOKEN_ADDRESS=0x...
# VALIDATOR_STAKING_ADDRESS=0x...
```

After deployment, update your `.env` file with the contract addresses.

## Step 5: Grant Roles to API Wallet

```bash
# Grant minter role (allows API to mint NEWS tokens)
npx hardhat run scripts/grantMinterRole.js --network sepolia

# Grant admin role to ArticleRegistry (for validator rewards/penalties)
npx hardhat run scripts/grantAdminRole.js --network sepolia
```

## Step 6: Set Up AI Fake News Detection

### Option A: Use Pre-trained Models (Recommended)

Download pre-trained models and place them in `Fake_News_Detection-main/models/`:
- `logistic_regression_model.pkl`
- `xgboost_model.pkl`
- `light_gbm_model.pkl`
- `random_forest_model.pkl`
- `model.safetensors` (BERT model)

**Note:** These files are large (~500 MB total) and not included in the repository. Contact the project maintainer for access.

### Option B: Train Your Own Models

1. Prepare a fake news dataset (CSV with columns: `text`, `label`)
2. Run the training script (create your own based on your ML framework)
3. Save models to `Fake_News_Detection-main/models/`

## Step 7: Start MongoDB

```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
```

Verify MongoDB is running:
```bash
mongo --eval "db.runCommand({ connectionStatus: 1 })"
```

## Step 8: Start All Services

### Terminal 1: AI Service
```bash
cd Fake_News_Detection-main
python api_service.py
```
Should see: `Running on http://127.0.0.1:5000`

### Terminal 2: API Backend
```bash
cd api
npm start
```
Should see: `API server running on port 4000`

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```
Should see: `Local: http://localhost:5173/`

## Step 9: Configure Frontend

Update `frontend/src/services/api.js` with your contract addresses:

```javascript
const ARTICLE_REGISTRY_ADDRESS = "0xYOUR_ADDRESS_HERE";
```

## Step 10: Test the Platform

1. Open browser to `http://localhost:5173`
2. Connect MetaMask (make sure you're on Sepolia testnet)
3. Try submitting a test article
4. Check the API logs to see AI scoring in action

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
- Make sure MongoDB is running: `mongod`
- Check if port 27017 is available
- Verify `MONGO_URI` in `.env`

### Issue: "Transaction failed: insufficient funds"
- Get more test ETH from Sepolia faucet
- Check your wallet balance in MetaMask

### Issue: "AI service not responding"
- Ensure `api_service.py` is running on port 5000
- Check if ML models are in the correct folder
- Try using Google NLP fallback instead

### Issue: "Contract call reverted"
- Verify contract addresses in `.env`
- Ensure roles were granted (Step 5)
- Check if you're on Sepolia testnet

### Issue: "CORS error in frontend"
- Ensure API is running on port 4000
- Check `api.js` has correct API URL

## Optional: Set Up Test Validators

To test the validator voting system:

1. Create 3-4 more Sepolia wallets
2. Add their private keys to `.env`:
```env
VALIDATOR_PRIVATE_KEY_1=...
VALIDATOR_PRIVATE_KEY_2=...
VALIDATOR_PRIVATE_KEY_3=...
```

3. Fund validators with test ETH:
```bash
npm run fund-validators
```

4. Mint and stake NEWS tokens:
```bash
npm run setup-validators
```

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Backend    │────▶│  Smart Contracts│
│ (React:5173)    │     │ (Express:4000)   │     │  (Sepolia)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  AI Service  │
                        │ (Flask:5000) │
                        └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   MongoDB    │
                        │  (Port:27017)│
                        └──────────────┘
```

## Production Deployment

For production deployment:

1. **Smart Contracts:** Deploy to Ethereum mainnet or L2 (Arbitrum, Optimism)
2. **API:** Deploy to VPS, AWS, or Heroku
3. **Frontend:** Deploy to Vercel, Netlify, or IPFS
4. **Database:** Use MongoDB Atlas (cloud)
5. **Environment:** Use proper secret management (AWS Secrets Manager, HashiCorp Vault)

## Security Checklist

- [ ] Never commit `.env` file
- [ ] Never use wallets with real funds for testing
- [ ] Rotate API keys regularly
- [ ] Enable rate limiting on API endpoints
- [ ] Add authentication for validator operations
- [ ] Audit smart contracts before mainnet deployment
- [ ] Use HTTPS for all API calls in production
- [ ] Enable CORS only for trusted domains

## Support

For issues or questions:
- Check the main [README.md](README.md)
- Review [CLAUDE.md](CLAUDE.md) for architecture details
- Open an issue on GitHub

## License

[Add your license here]
