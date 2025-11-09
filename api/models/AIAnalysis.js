import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema({
  articleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  trustScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  consensus: {
    type: String,
    required: true,
    enum: ['HIGH_TRUST', 'MEDIUM_TRUST', 'LOW_TRUST', 'REAL', 'FAKE']
  },
  autoPublish: {
    type: Boolean,
    required: true,
    default: false
  },
  totalModels: {
    type: Number,
    required: true,
    default: 1
  },
  models: [{
    name: {
      type: String,
      required: true
    },
    prediction: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  analyzedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);

export default AIAnalysis;
