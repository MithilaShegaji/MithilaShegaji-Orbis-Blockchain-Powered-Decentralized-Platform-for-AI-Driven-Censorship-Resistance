# Orbis + Fake News Detection Integration Guide

## Overview

This guide explains how the Orbis blockchain news platform is integrated with the AI-powered fake news detection system.

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React + Vite) │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│     Node.js API Backend (Port 4000)     │
│  - Article submission                   │
│  - IPFS upload (Pinata)                 │
│  - Blockchain interaction               │
└────────┬──────────────────────┬─────────┘
         │                      │
         ↓                      ↓
┌─────────────────┐    ┌───────────────────────┐
│ Fake News API   │    │  Smart Contracts      │
│ (Python - 5000) │    │  - ArticleRegistry    │
│                 │    │  - ValidatorStaking   │
│ - BERT Model    │    │  - NewsToken          │
│ - XGBoost       │    └───────────────────────┘
│ - Random Forest │
│ - LightGBM      │
│ - Log Regression│
└─────────────────┘
```

## How It Works

### Article Validation Flow

1. **User submits article** through the frontend
2. **Node.js API** receives the article and:
   - Uploads content to IPFS via Pinata
   - Submits article metadata to ArticleRegistry smart contract
   - Extracts article ID from blockchain transaction
3. **AI Analysis** is triggered automatically:
   - Article content is sent to Fake News Detection API (Python microservice)
   - 5 ML models analyze the content:
     - **BERT** (DistilBERT - transformer model) - 2 votes
     - **XGBoost** (gradient boosting) - 1 vote
     - **Random Forest** (ensemble trees) - 1 vote
     - **LightGBM** (lightweight boosting) - 1 vote
     - **Logistic Regression** (linear classifier) - 1 vote
   - Models vote: FAKE or REAL
   - Consensus is determined by majority voting
4. **Trust Score Calculation**:
   - Weighted average of model confidences (BERT weighted 2x)
   - If consensus = REAL: trust score = weighted confidence
   - If consensus = FAKE: trust score = 100 - weighted confidence
   - Result: 0-100 scale trust score
5. **Smart Contract Decision**:
   - Trust score is submitted to ArticleRegistry via `setAIScore()`
   - **If score ≥ 80**: Article is **auto-published** ✓
   - **If score < 80**: Article goes to **validator voting** ⟳
6. **Validator Review** (if needed):
   - Staked validators vote YES/NO
   - Requires 75% consensus with minimum 3 votes
   - Correct votes earn rewards, incorrect votes are penalized

## Trust Score Examples

| Scenario | BERT | Avg Conf | Weighted | Consensus | Trust Score | Result |
|----------|------|----------|----------|-----------|-------------|--------|
| High quality news | 95% | 92% | 93% | REAL | **93** | ✅ Auto-publish |
| Moderate quality | 85% | 82% | 83% | REAL | **83** | ✅ Auto-publish |
| Borderline article | 78% | 75% | 76% | REAL | **76** | ⟳ Validators |
| Likely fake news | 92% | 88% | 89% | FAKE | **11** | ⟳ Validators |
| Questionable content | 65% | 70% | 68% | FAKE | **32** | ⟳ Validators |

## Setup Instructions

### Prerequisites

1. **Node.js** (v18+)
2. **Python** (v3.8+)
3. **MongoDB** (running locally or remote)
4. **Sepolia testnet** RPC access
5. **SepoliaETH** for gas fees

### Step 1: Install Python Fake News Detection Service

```bash
cd "Fake_News_Detection-main"

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements-api.txt

# Download NLTK data
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### Step 2: Start Fake News Detection API

```bash
cd "Fake_News_Detection-main"

# Option A: Using batch script (Windows)
start-api.bat

# Option B: Manual start
venv\Scripts\activate
python api_service.py
```

The service will start on **port 5000**.

### Step 3: Verify Fake News API is Running

Open a new terminal and test:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "models_loaded": 5,
  "bert_available": true,
  "device": "cpu"
}
```

### Step 4: Start Node.js API Backend

```bash
cd api
npm start
```

The API will start on **port 4000**.

### Step 5: Start Frontend (Optional)

```bash
cd frontend
npm run dev
```

The frontend will start on **port 5173**.

## Testing the Integration

### Test 1: High Trust Score (Auto-Publish)

Submit a legitimate news article:

```bash
curl -X POST http://localhost:4000/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Scientific Breakthrough in Renewable Energy",
    "content": "Researchers at MIT have developed a new solar panel technology that increases efficiency by 40%. The breakthrough involves using perovskite materials in a novel configuration. This advancement could significantly reduce the cost of solar energy and accelerate the transition to renewable power sources."
  }'
```

**Expected Result:**
- Trust score: ~85-95
- Consensus: REAL
- Status: Auto-published (no validator voting needed)

### Test 2: Low Trust Score (Validator Voting)

Submit questionable or fake content:

```bash
curl -X POST http://localhost:4000/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "SHOCKING: Aliens Land in New York City",
    "content": "Unbelievable footage shows alien spacecraft landing in Times Square. Government officials are covering up the truth. Anonymous sources confirm extraterrestrial contact. This changes everything we know about the universe."
  }'
```

**Expected Result:**
- Trust score: ~10-40
- Consensus: FAKE
- Status: Sent to validator voting

### Test 3: Direct API Test

Test the Fake News Detection API directly:

```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Breaking news: Scientists discover cure for common cold. New treatment shows 100% success rate in clinical trials."
  }'
```

**Expected Response:**
```json
{
  "trustScore": 45,
  "consensus": "FAKE",
  "autoPublish": false,
  "results": {
    "BERT": {
      "label": "FAKE",
      "confidence": 87.5
    },
    "XGBoost": {
      "label": "FAKE",
      "confidence": 82.3
    },
    ...
  },
  "totalModels": 5,
  "bertAvailable": true
}
```

## Configuration

### Environment Variables

Located in `.env` file:

```bash
# Fake News Detection API service URL
FAKE_NEWS_API_URL=http://localhost:5000

# Legacy Google NLP (kept as fallback)
GOOGLE_NLP_API_KEY=your_google_api_key

# Blockchain configuration
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0x...

# Contract addresses
ARTICLE_REGISTRY_ADDRESS=0x...
NEWS_TOKEN_ADDRESS=0x...
VALIDATOR_STAKING_ADDRESS=0x...

# IPFS (Pinata)
PINATA_API_KEY=...
PINATA_SECRET_API_KEY=...
PINATA_GATEWAY_URL=...

# Database
MONGO_URI=mongodb://localhost:27017/Orbis
```

## Monitoring and Logs

### Node.js API Logs

When an article is submitted, you'll see:

```
AI scoring started for article ID: 1...
Fake News Detection Results for article 1:
  Consensus: REAL
  Trust Score: 88
  Auto-Publish: YES (≥80)
  Models used: 5
  Model results: {
    "BERT": {"label": "REAL", "confidence": 92.5},
    "XGBoost": {"label": "REAL", "confidence": 85.3},
    ...
  }
Submitting AI score 88 for article 1 to blockchain...
AI score submitted for article 1. Tx: 0x1234...
Result: ✓ Auto-published
```

### Python API Logs

When processing an article:

```
--- Analyzing article (1250 characters) ---
BERT: REAL (92.50%)
XGBoost: REAL (85.30%)
Random Forest: REAL (88.70%)
LightGBM: REAL (84.10%)
Logistic Regression: REAL (79.45%)
Consensus: REAL
Trust Score: 88
Auto-Publish: True
--- Analysis complete ---
```

## Performance Considerations

### Model Loading Time
- **Initial startup**: 10-30 seconds (loads all models)
- **BERT model**: ~500MB RAM usage
- **Traditional models**: ~100MB RAM total

### Inference Time
- **BERT inference**: 1-2 seconds per article (CPU), <500ms (GPU)
- **Traditional ML**: <100ms per article
- **Total analysis time**: ~2-3 seconds per article

### Optimization Tips

1. **Use GPU for BERT**: Install CUDA-enabled PyTorch
   ```bash
   pip install torch --index-url https://download.pytorch.org/whl/cu118
   ```

2. **Implement caching**: Cache results for identical content
3. **Batch processing**: Use `/batch-analyze` endpoint for multiple articles
4. **Load balancing**: Run multiple Python service instances

## Troubleshooting

### Issue: Fake News API not responding

**Solution:**
```bash
# Check if service is running
curl http://localhost:5000/health

# Restart service
cd Fake_News_Detection-main
venv\Scripts\activate
python api_service.py
```

### Issue: Models not loading

**Error:** "Error loading DistilBERT model"

**Solution:**
```bash
# Check model files exist
dir Fake_News_Detection-main\models

# Required files:
# - model.safetensors (or config to download from HuggingFace)
# - config.json
# - tokenizer.json
# - *.pkl files (traditional models)
```

### Issue: "Insufficient funds" error

**Solution:** You need SepoliaETH for gas fees. Use a faucet:
- https://sepoliafaucet.com/
- https://www.infura.io/faucet/sepolia

### Issue: Trust scores always low

**Solution:**
- Check that BERT model is loaded (`bertAvailable: true`)
- Verify article content is substantial (>100 words recommended)
- Review model results in logs to identify which models are failing

## API Endpoints

### Fake News Detection API (Port 5000)

#### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": 5,
  "bert_available": true,
  "device": "cpu"
}
```

#### `POST /analyze`
Analyze a single article

**Request:**
```json
{
  "content": "Article text here..."
}
```

**Response:**
```json
{
  "trustScore": 88,
  "consensus": "REAL",
  "autoPublish": true,
  "results": {
    "BERT": {"label": "REAL", "confidence": 92.5},
    ...
  },
  "totalModels": 5,
  "bertAvailable": true
}
```

#### `POST /batch-analyze`
Analyze multiple articles in batch

**Request:**
```json
{
  "articles": [
    {"id": "1", "content": "Article 1 text..."},
    {"id": "2", "content": "Article 2 text..."}
  ]
}
```

### Node.js API (Port 4000)

All existing endpoints remain the same. The AI scoring now uses the fake news detection service instead of Google NLP.

## Deployment Considerations

### Production Deployment

1. **Containerization**: Use Docker for both services
   ```dockerfile
   # Example Dockerfile for Python service
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements-api.txt .
   RUN pip install -r requirements-api.txt
   COPY . .
   CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "api_service:app"]
   ```

2. **Process Management**: Use PM2 for Node.js, systemd for Python
3. **Reverse Proxy**: Use Nginx to route traffic
4. **HTTPS**: Enable SSL/TLS for production
5. **Monitoring**: Set up logging and monitoring (e.g., Prometheus, Grafana)

### Scaling

- Run multiple Python service instances behind a load balancer
- Use Redis for caching analysis results
- Consider using model serving platforms (TensorFlow Serving, TorchServe)

## Security Notes

- Never expose private keys in code or logs
- Use environment variables for sensitive configuration
- Implement rate limiting on API endpoints
- Validate and sanitize all user inputs
- Keep dependencies updated for security patches

## Support

For issues or questions:
1. Check the logs in both services
2. Verify all environment variables are set correctly
3. Ensure all services (MongoDB, Python API, Node.js API) are running
4. Test each component independently before testing the full flow

## License

This integration is part of the Orbis project.
