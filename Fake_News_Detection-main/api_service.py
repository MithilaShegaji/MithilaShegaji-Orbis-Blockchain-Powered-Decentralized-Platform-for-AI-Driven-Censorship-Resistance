from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import re
import numpy as np
import pandas as pd
import lightgbm as lgb
import xgboost as xgb
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
import os
import joblib
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Create Flask app for REST API
app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js backend integration

# Download NLTK resources
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
stop_words = set(stopwords.words('english'))
portStemmer = PorterStemmer()

print("Loading ML models...")

# Load models and vectorizer once at startup
try:
    xgboost_model = joblib.load("models/xgboost_model.pkl")
    random_forest_model = joblib.load("models/random_forest_model.pkl")
    lightgbm_model = joblib.load("models/light_gbm_model.pkl")
    logistic_regression_model = joblib.load("models/logistic_regression_model.pkl")
    vectorizer = joblib.load("models/vectorizer.pkl")
    print("Traditional ML models loaded successfully!")
except Exception as e:
    print(f"Error loading traditional ML models: {e}")
    raise e

# Load BERT model and tokenizer
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

bert_model_path = "models"
try:
    bert_tokenizer = AutoTokenizer.from_pretrained(bert_model_path)
    bert_model = AutoModelForSequenceClassification.from_pretrained(bert_model_path)
    bert_model.to(device)
    bert_model.eval()
    bert_available = True
    print("DistilBERT model loaded successfully!")
except Exception as e:
    print(f"Warning: DistilBERT model not available: {e}")
    print("Falling back to traditional ML models only.")
    bert_available = False

models = {
    "XGBoost": xgboost_model,
    "Random Forest": random_forest_model,
    "LightGBM": lightgbm_model,
    "Logistic Regression": logistic_regression_model
}

if bert_available:
    models["BERT"] = bert_model


def clean(text):
    """Clean text by lowercasing and removing special characters"""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    return text


def preprocess(text):
    """Preprocess text: clean, tokenize, remove stopwords, and stem"""
    text = clean(text)
    tokens = [portStemmer.stem(word) for word in text.split() if word not in stop_words]
    return ' '.join(tokens)


def predict_with_bert(text):
    """Predict using BERT model"""
    max_length = 512

    # Tokenize the text
    inputs = bert_tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=max_length,
        padding="max_length"
    )

    # Move inputs to device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Get predictions
    with torch.no_grad():
        outputs = bert_model(**inputs)
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=1)

    # Get predicted class and confidence
    probs = probabilities.cpu().numpy()[0]
    prediction = int(np.argmax(probs))  # Convert to native Python int
    confidence = float(probs[prediction]) * 100  # Already converted to float

    # Class 1 = FAKE, Class 0 = REAL
    label = "FAKE" if prediction == 1 else "REAL"

    return label, float(confidence)  # Ensure float return


def predict_single_article(article):
    """
    Predict fake news for a single article using ensemble of models.
    Returns detailed results with per-model predictions and consensus.
    """
    # Preprocess the article
    processed_article = preprocess(article)
    article_vectorized = vectorizer.transform([processed_article])

    model_results = {}

    # Run BERT prediction if available
    if bert_available:
        try:
            label, confidence = predict_with_bert(article)
            model_results["BERT"] = {
                "label": label,
                "confidence": round(confidence, 2)
            }
            print(f"BERT: {label} ({confidence:.2f}%)")
        except Exception as e:
            print(f"BERT prediction failed: {e}")

    # Run traditional ML model predictions
    for name, model in models.items():
        if name == "BERT":
            continue

        try:
            prob = model.predict_proba(article_vectorized)[0]
            prediction = int(model.predict(article_vectorized)[0])  # Convert to Python int
            confidence = float(max(prob)) * 100  # Convert to Python float
            label = "FAKE" if prediction == 1 else "REAL"
            model_results[name] = {
                "label": label,
                "confidence": round(float(confidence), 2)  # Ensure native Python float
            }
            print(f"{name}: {label} ({confidence:.2f}%)")
        except Exception as e:
            print(f"{name} prediction failed: {e}")

    # Calculate consensus - BERT counts as 2 votes
    votes = []
    for model_name, info in model_results.items():
        if model_name == "BERT":
            votes.extend([info['label'], info['label']])  # BERT counts twice
        else:
            votes.append(info['label'])

    consensus_label = "FAKE" if votes.count("FAKE") > len(votes) / 2 else "REAL"

    return model_results, consensus_label


def calculate_trust_score(model_results, consensus):
    """
    Calculate Orbis trust score (0-100) from fake news detection results.

    Algorithm:
    1. Calculate weighted average confidence (BERT gets 2x weight)
    2. If consensus is REAL, use confidence as trust score
    3. If consensus is FAKE, invert confidence (100 - confidence)
    4. Ensure score is in 0-100 range
    """
    if not model_results:
        return 50  # Default neutral score if no results

    # Extract confidences
    confidences = []
    weights = []

    for model_name, info in model_results.items():
        confidence = info['confidence']
        if model_name == "BERT":
            # BERT gets double weight
            confidences.append(confidence)
            confidences.append(confidence)
            weights.extend([1, 1])
        else:
            confidences.append(confidence)
            weights.append(1)

    # Calculate weighted average
    if len(confidences) == 0:
        weighted_confidence = 50
    else:
        weighted_confidence = sum(confidences) / len(confidences)

    # Map to trust score
    if consensus == "REAL":
        trust_score = weighted_confidence
    else:  # FAKE
        trust_score = 100 - weighted_confidence

    # Ensure 0-100 range and convert to native Python int
    trust_score = max(0, min(100, trust_score))

    return int(round(float(trust_score)))


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "models_loaded": len(models),
        "bert_available": bert_available,
        "device": str(device)
    })


@app.route('/analyze', methods=['POST'])
def analyze_article():
    """
    Analyze an article for fake news detection.

    Request body:
    {
        "content": "article text to analyze"
    }

    Response:
    {
        "trustScore": 85,
        "consensus": "REAL",
        "results": {
            "BERT": {"label": "REAL", "confidence": 92.5},
            "XGBoost": {"label": "REAL", "confidence": 87.3},
            ...
        },
        "autoPublish": true
    }
    """
    try:
        # Get article content from request
        data = request.get_json()

        if not data or 'content' not in data:
            return jsonify({
                "error": "Missing 'content' field in request body"
            }), 400

        content = data['content']

        if not content or len(content.strip()) == 0:
            return jsonify({
                "error": "Article content cannot be empty"
            }), 400

        print(f"\n--- Analyzing article ({len(content)} characters) ---")

        # Run fake news detection
        model_results, consensus = predict_single_article(content)

        # Calculate Orbis trust score
        trust_score = calculate_trust_score(model_results, consensus)

        # Determine if auto-publish (score >= 80)
        auto_publish = trust_score >= 80

        print(f"Consensus: {consensus}")
        print(f"Trust Score: {trust_score}")
        print(f"Auto-Publish: {auto_publish}")
        print("--- Analysis complete ---\n")

        # Return response
        return jsonify({
            "trustScore": trust_score,
            "consensus": consensus,
            "results": model_results,
            "autoPublish": auto_publish,
            "totalModels": len(model_results),
            "bertAvailable": bert_available
        })

    except Exception as e:
        print(f"Error in /analyze endpoint: {e}")
        return jsonify({
            "error": "Internal server error during analysis",
            "details": str(e)
        }), 500


@app.route('/batch-analyze', methods=['POST'])
def batch_analyze():
    """
    Analyze multiple articles in batch.

    Request body:
    {
        "articles": [
            {"id": "1", "content": "article text 1"},
            {"id": "2", "content": "article text 2"}
        ]
    }
    """
    try:
        data = request.get_json()

        if not data or 'articles' not in data:
            return jsonify({
                "error": "Missing 'articles' field in request body"
            }), 400

        articles = data['articles']
        results = []

        for article in articles:
            article_id = article.get('id', 'unknown')
            content = article.get('content', '')

            if not content:
                results.append({
                    "id": article_id,
                    "error": "Empty content"
                })
                continue

            try:
                model_results, consensus = predict_single_article(content)
                trust_score = calculate_trust_score(model_results, consensus)

                results.append({
                    "id": article_id,
                    "trustScore": trust_score,
                    "consensus": consensus,
                    "autoPublish": trust_score >= 80
                })
            except Exception as e:
                results.append({
                    "id": article_id,
                    "error": str(e)
                })

        return jsonify({
            "results": results,
            "total": len(articles),
            "processed": len(results)
        })

    except Exception as e:
        return jsonify({
            "error": "Batch analysis failed",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    print("\n" + "="*60)
    print("Orbis Fake News Detection API Service")
    print("="*60)
    print(f"Models loaded: {len(models)}")
    print(f"BERT available: {bert_available}")
    print(f"Device: {device}")
    print("="*60 + "\n")

    # Run on port 5000 (different from Node.js API on 4000)
    app.run(host='0.0.0.0', port=5000, debug=False)
