# Orbis + Fake News Detection Integration - Summary

## ✅ What Was Done

### 1. Created Python Microservice API
- **File:** `Fake_News_Detection-main/api_service.py`
- **Port:** 5000
- **Features:**
  - REST API wrapper around fake news detection models
  - Integrates 5 ML models (BERT, XGBoost, Random Forest, LightGBM, Logistic Regression)
  - Returns trust score (0-100) for Orbis platform
  - Endpoints: `/health`, `/analyze`, `/batch-analyze`

### 2. Updated Node.js Backend
- **File:** `api/index.js`
- **Changes:**
  - Replaced Google NLP sentiment analysis with fake news detection
  - Added `analyzeFakeNews()` function to call Python microservice
  - Updated `scoreArticle()` to use trust scores from fake news detection
  - Kept Google NLP as fallback (legacy support)

### 3. Implemented Trust Score Algorithm
**Mapping Logic:**
```javascript
// Weighted average (BERT gets 2x weight)
weightedConfidence = (BERT*2 + XGBoost + RF + LightGBM + LogReg) / 6

// If REAL news: trust score = confidence
// If FAKE news: trust score = 100 - confidence
if (consensus === 'REAL') {
    trustScore = weightedConfidence
} else {
    trustScore = 100 - weightedConfidence
}
```

**Result:** Score ≥80 → Auto-publish | Score <80 → Validator voting

### 4. Added Configuration
- **File:** `.env`
- **Added:** `FAKE_NEWS_API_URL=http://localhost:5000`

### 5. Created Startup Scripts
- `Fake_News_Detection-main/start-api.bat` - Start Python service
- `start-all-services.bat` - Start both Python + Node.js services

### 6. Comprehensive Documentation
- `INTEGRATION_GUIDE.md` - Full integration documentation with examples

---

## 🚀 Quick Start Guide

### Prerequisites Check
```bash
# Check Python
python --version  # Should be 3.8+

# Check Node.js
node --version    # Should be 18+

# Check MongoDB
mongod --version
```

### Setup (First Time Only)

#### Step 1: Install Python Dependencies
```bash
cd "Fake_News_Detection-main"
python -m venv venv
venv\Scripts\activate
pip install -r requirements-api.txt
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

#### Step 2: Verify Environment Variables
Check `.env` file has:
```
FAKE_NEWS_API_URL=http://localhost:5000
RPC_URL=<your_sepolia_rpc>
PRIVATE_KEY=<your_private_key>
ARTICLE_REGISTRY_ADDRESS=<deployed_address>
NEWS_TOKEN_ADDRESS=<deployed_address>
VALIDATOR_STAKING_ADDRESS=<deployed_address>
```

### Running the System

#### Option A: Run All Services (Recommended)
```bash
# Start MongoDB first
mongod

# In a new terminal, run:
start-all-services.bat
```

This will open two command windows:
- Window 1: Fake News Detection API (Port 5000)
- Window 2: Node.js Backend API (Port 4000)

#### Option B: Manual Start (Each in Separate Terminal)

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Fake News API:**
```bash
cd "Fake_News_Detection-main"
venv\Scripts\activate
python api_service.py
```

**Terminal 3 - Node.js API:**
```bash
cd api
npm start
```

**Terminal 4 - Frontend (Optional):**
```bash
cd frontend
npm run dev
```

---

## 🧪 Testing the Integration

### Test 1: Health Check
```bash
# Check Fake News API
curl http://localhost:5000/health

# Expected:
# {"status": "healthy", "models_loaded": 5, "bert_available": true}

# Check Node.js API
curl http://localhost:4000/health

# Expected:
# API alive
```

### Test 2: Submit Legitimate News (Should Auto-Publish)
```bash
curl -X POST http://localhost:4000/articles \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Major Scientific Discovery\", \"content\": \"Scientists at leading research institutions have announced a breakthrough in renewable energy technology. The new solar panel design increases efficiency by 40 percent while reducing manufacturing costs. Independent testing has verified the results, and the technology is expected to be commercially available within two years. This development represents a significant step forward in the global transition to clean energy.\"}"
```

**Expected Result:**
- Trust Score: 80-95
- Consensus: REAL
- Status: Auto-published ✓

### Test 3: Submit Questionable News (Should Go to Validators)
```bash
curl -X POST http://localhost:4000/articles \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"SHOCKING Discovery\", \"content\": \"Anonymous sources reveal incredible truth about government conspiracy. Leaked documents prove everything you know is wrong. Mainstream media covering up the facts. Share before they delete this! Click here to learn the truth they don't want you to know.\"}"
```

**Expected Result:**
- Trust Score: 10-40
- Consensus: FAKE
- Status: Sent to validators ⟳

### Test 4: Direct API Test
```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"Breaking: Scientists discover cure for aging\"}"
```

---

## 📊 What Happens When You Submit an Article

### Flow Diagram
```
1. User submits article
   ↓
2. API uploads to IPFS (Pinata)
   ↓
3. API calls ArticleRegistry.submitArticle()
   ↓
4. API extracts articleId from transaction
   ↓
5. API sends content to Fake News Detection service (Port 5000)
   ↓
6. Python service runs 5 ML models:
   - BERT (deep learning transformer)
   - XGBoost (gradient boosting)
   - Random Forest (ensemble trees)
   - LightGBM (fast boosting)
   - Logistic Regression (linear)
   ↓
7. Models vote → Consensus (FAKE or REAL)
   ↓
8. Trust score calculated (0-100)
   ↓
9. API calls ArticleRegistry.setAIScore(articleId, trustScore)
   ↓
10. Smart contract decides:
    - Score ≥80 → AUTO-PUBLISH ✅
    - Score <80 → VALIDATOR VOTING ⟳
```

### Console Output Example

**Node.js API Console:**
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
    "Random Forest": {"label": "REAL", "confidence": 88.7},
    "LightGBM": {"label": "REAL", "confidence": 84.1},
    "Logistic Regression": {"label": "REAL", "confidence": 79.4}
  }
Submitting AI score 88 for article 1 to blockchain...
AI score submitted for article 1. Tx: 0x1234abcd...
Result: ✓ Auto-published
```

**Python API Console:**
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

---

## 🎯 Key Features

### 1. Ensemble AI Validation
- **5 different ML models** working together
- **Weighted voting** (BERT counts 2x)
- **Robust detection** of fake news patterns

### 2. Smart Auto-Publishing
- High-quality news (≥80% trust) published immediately
- Questionable content sent to human validators
- Reduces validator workload for obvious cases

### 3. Transparent Scoring
- Detailed per-model results logged
- Clear explanation of why content was approved/rejected
- Auditable AI decision-making process

### 4. Fallback Support
- Google NLP kept as legacy fallback
- Graceful degradation if Python service unavailable
- Error handling throughout the pipeline

---

## 🔧 Troubleshooting

### Problem: Python API won't start
**Error:** "ModuleNotFoundError: No module named 'flask'"

**Solution:**
```bash
cd "Fake_News_Detection-main"
venv\Scripts\activate
pip install -r requirements-api.txt
```

### Problem: "Connection refused" to port 5000
**Check if service is running:**
```bash
curl http://localhost:5000/health
```

**Restart Python service:**
```bash
cd "Fake_News_Detection-main"
venv\Scripts\activate
python api_service.py
```

### Problem: Trust scores always low
**Check BERT model status:**
```bash
curl http://localhost:5000/health
```

Look for `"bert_available": true`. If false, BERT model failed to load.

**Solution:** Check that model files exist in `Fake_News_Detection-main/models/`

### Problem: "Insufficient funds" error
**You need SepoliaETH for gas fees.**

Get free testnet ETH:
- https://sepoliafaucet.com/ (Alchemy)
- https://www.infura.io/faucet/sepolia (Infura)

### Problem: MongoDB not running
```bash
# Start MongoDB
mongod

# Or check if running:
tasklist | findstr mongod
```

---

## 📁 New Files Created

```
Orbis - Major_Project/
├── Fake_News_Detection-main/
│   ├── api_service.py              ← Python REST API microservice
│   ├── requirements-api.txt         ← Production dependencies
│   └── start-api.bat                ← Quick start script
├── api/
│   └── index.js                     ← Updated with fake news integration
├── .env                             ← Added FAKE_NEWS_API_URL
├── INTEGRATION_GUIDE.md             ← Full documentation
├── INTEGRATION_SUMMARY.md           ← This file
└── start-all-services.bat           ← Start all services at once
```

---

## 🎉 Next Steps

### 1. Initial Setup
```bash
# Install Python dependencies
cd "Fake_News_Detection-main"
python -m venv venv
venv\Scripts\activate
pip install -r requirements-api.txt
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### 2. Start Services
```bash
# Option 1: Use startup script
start-all-services.bat

# Option 2: Manual (each in separate terminal)
mongod
cd "Fake_News_Detection-main" && venv\Scripts\activate && python api_service.py
cd api && npm start
cd frontend && npm run dev
```

### 3. Test the System
- Submit a legitimate news article
- Submit a questionable article
- Watch the console logs to see AI analysis
- Check blockchain for published articles

### 4. Monitor Performance
- Check API response times
- Review trust score distributions
- Analyze auto-publish vs validator voting rates

---

## 📞 Support

If you encounter issues:

1. **Check all services are running:**
   ```bash
   curl http://localhost:5000/health  # Fake News API
   curl http://localhost:4000/health  # Node.js API
   ```

2. **Review console logs** for error messages

3. **Verify environment variables** in `.env` file

4. **Check MongoDB** is running and accessible

5. **Ensure SepoliaETH** balance for gas fees

6. **Test each component independently** before testing full flow

---

## 📚 Additional Resources

- **Full Integration Guide:** `INTEGRATION_GUIDE.md`
- **Project Overview:** `CLAUDE.md`
- **Original Fake News Detection:** `Fake_News_Detection-main/README.md`

---

**Integration completed successfully!** 🎊

The Orbis platform now uses advanced AI-powered fake news detection with multi-model ensemble validation, automatic publishing for high-quality content, and human validator review for questionable content.
