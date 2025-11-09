# Orbis: Blockchain-Powered Decentralized Platform for AI-Driven Censorship Resistance

**Orbis** is a decentralized news verification platform that combines AI-powered content analysis with community validator voting to create a censorship-resistant truth verification system.

## Overview

Orbis combines AI-powered analysis with blockchain validator voting to verify news credibility and resist censorship. Articles receive trust scores (0-100) from machine learning models. High-confidence content (≥80) auto-publishes instantly, while borderline articles undergo decentralized validator review. Staked validators earn rewards for accuracy and face penalties for errors. All content is stored on IPFS, ensuring permanent access—truth cannot be silenced.

## Key Features

- ✅ **Dual-Layer Validation:** AI screening + human validator consensus
- ✅ **Token-Based Economics:** Validators stake NEWS tokens, earn rewards for accuracy
- ✅ **Censorship Resistance:** IPFS storage ensures permanent content availability
- ✅ **Article Versioning:** Published articles can be updated via proposal system
- ✅ **Transparent Governance:** All votes and decisions recorded on-chain
- ✅ **Auto-Publication:** High-trust content (≥80 score) publishes immediately

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                      │
│  Article submission, voting UI, validator dashboard, analytics   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  API Backend (Node.js + Express)                 │
│  Contract interaction, IPFS uploads, AI scoring, MongoDB cache   │
└────────┬─────────────────┬──────────────────┬────────────────────┘
         │                 │                  │
         ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│Smart Contracts│  │  AI Service  │  │  MongoDB (Cache)     │
│  (Sepolia)   │  │(Flask:5000)  │  │  Articles & Stats    │
│              │  │ ML Models    │  │                      │
│- NewsToken   │  └──────────────┘  └──────────────────────┘
│- Staking     │
│- Registry    │  ┌──────────────────────┐
└──────────────┘  │  IPFS/Pinata         │
                  │  Content Storage     │
                  └──────────────────────┘
```

## Tech Stack

### Smart Contracts
- Solidity 0.8.20
- Hardhat development framework
- OpenZeppelin contracts (ERC20, AccessControl)
- Deployed on Ethereum Sepolia testnet

### Backend
- Node.js + Express.js
- ethers.js v6 for blockchain interaction
- MongoDB for caching
- Pinata for IPFS storage

### Frontend
- React 19 + Vite 7
- Material-UI 7 for components
- Tailwind CSS 4 for styling
- Recharts for analytics

### AI/ML
- Python Flask API
- PyTorch, XGBoost, LightGBM ensemble
- BERT transformer for text analysis
- Google Cloud NLP (fallback)

## Quick Start

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB
- MetaMask wallet
- Sepolia testnet ETH

### Installation

```bash
# Clone repository
git clone https://github.com/MithilaShegaji/MithilaShegaji-Orbis-Blockchain-Powered-Decentralized-Platform-for-AI-Driven-Censorship-Resistance.git
cd Orbis-Blockchain-Powered-Decentralized-Platform-for-AI-Driven-Censorship-Resistance

# Install dependencies
npm install
cd api && npm install && cd ..
cd frontend && npm install && cd ..
cd Fake_News_Detection-main && pip install -r requirements.txt && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your API keys and wallet

# Deploy contracts
npx hardhat compile
npx hardhat run scripts/deploy-all.js --network sepolia

# Start services
cd Fake_News_Detection-main && python api_service.py &  # Terminal 1
cd api && npm start &                                     # Terminal 2
cd frontend && npm run dev                                # Terminal 3
```

**For detailed setup instructions, see [SETUP.md](SETUP.md)**

## How It Works

### Article Submission Flow

1. **Submit Article:** User submits article (title + content) via frontend
2. **IPFS Upload:** Content uploaded to IPFS, receives unique CID
3. **Blockchain Record:** Article metadata stored on-chain
4. **AI Scoring:** ML models analyze content, generate trust score (0-100)
5. **Auto-Decision:**
   - **Score ≥80:** Article auto-published immediately ✅
   - **Score <80:** Article sent to validator review queue ⏳

### Validator Voting

1. **Stake Requirement:** Validators must stake 100+ NEWS tokens
2. **Vote:** Validators vote yes/no on article credibility
3. **Consensus:** Requires 5+ votes with 80% agreement
4. **Finalization:**
   - **≥80% yes:** Article published, "yes" voters rewarded (+10 NEWS)
   - **<80% yes:** Article rejected, "no" voters rewarded (+10 NEWS)
5. **Penalties:** Incorrect voters lose 5 NEWS tokens

## Smart Contracts

### NewsToken.sol
ERC20 governance token with minting controls
- Symbol: NEWS
- Decimals: 18
- Mintable by API wallet only

### ValidatorStaking.sol
Manages validator token stakes and rewards
- Minimum stake: 100 NEWS
- Rewards: +10 NEWS per correct vote
- Penalties: -5 NEWS per incorrect vote

### ArticleRegistry.sol
Core article validation engine
- Article submissions and versioning
- AI score integration
- Validator voting logic
- Automatic consensus finalization
- Update proposal system

## Project Structure

```
.
├── contracts/              # Solidity smart contracts
├── scripts/                # Hardhat deployment scripts
├── api/                    # Express.js backend
│   ├── index.js           # Main API server
│   ├── models/            # MongoDB schemas
│   ├── abis/              # Contract ABIs
│   └── utils/             # Validator tracking
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API calls
│   │   └── contexts/      # React contexts
│   └── public/
├── Fake_News_Detection-main/  # AI service
│   ├── api_service.py     # Flask API
│   ├── app.py             # Web interface
│   ├── models/            # Tokenizer configs
│   └── requirements.txt   # Python deps
└── test/                   # Contract tests
```

## Configuration

### Environment Variables

Required in `.env`:
- `RPC_URL` - Ethereum Sepolia RPC endpoint
- `PRIVATE_KEY` - Deployer wallet private key
- `PINATA_API_KEY` - IPFS storage credentials
- `GOOGLE_NLP_API_KEY` - AI fallback service
- `MONGO_URI` - MongoDB connection string
- Contract addresses (after deployment)

See [.env.example](.env.example) for full configuration.

## Development

### Compile Contracts
```bash
npx hardhat compile
```

### Deploy to Sepolia
```bash
npx hardhat run scripts/deploy-all.js --network sepolia
```

### Run Tests
```bash
npx hardhat test
```

### Start Development Servers
```bash
# API backend (port 4000)
cd api && npm start

# Frontend (port 5173)
cd frontend && npm run dev

# AI service (port 5000)
cd Fake_News_Detection-main && python api_service.py
```

## API Endpoints

### Articles
- `POST /articles` - Submit new article
- `GET /articles` - List all articles
- `GET /articles/:id` - Get article details
- `POST /articles/:id/vote` - Vote on article

### Validators
- `GET /validators/:address` - Get validator stats
- `GET /validators/leaderboard/top` - Top validators
- `POST /stake-validator` - Stake NEWS tokens

### Versioning
- `POST /articles/:id/propose-update` - Propose article update
- `POST /articles/:id/proposals/:id/vote` - Vote on update
- `GET /articles/:id/versions` - Get version history

See [API Documentation](api/README.md) for complete endpoint list.

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

⚠️ **Security Notes:**
- Never commit `.env` files
- Never use wallets with real funds for testing
- Audit smart contracts before mainnet deployment
- Rotate API keys regularly

Report security vulnerabilities to: [your-email@example.com]

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Pinata for IPFS infrastructure
- Alchemy for blockchain RPC services
- Hugging Face for transformer models

## Roadmap

- [ ] Mainnet deployment on Ethereum L2
- [ ] Mobile app (iOS/Android)
- [ ] DAO governance for platform parameters
- [ ] Multi-language support
- [ ] Cross-chain validator participation
- [ ] Enhanced ML models with domain-specific training
- [ ] Browser extension for real-time fact-checking

## Links

- **Documentation:** [CLAUDE.md](CLAUDE.md) - Detailed architecture
- **Setup Guide:** [SETUP.md](SETUP.md) - Step-by-step installation
- **Integration Guide:** [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- **Live Demo:** [Coming Soon]
- **Whitepaper:** [Coming Soon]

---

**Built with ❤️ for a censorship-resistant future**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
