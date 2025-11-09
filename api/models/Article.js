import mongoose from 'mongoose';

const ArticleVersionSchema = new mongoose.Schema({
  versionIndex: { type: Number, required: true },
  ipfsCid: { type: String, required: true },
  contentHash: { type: String, required: true },
  title: String,
  content: String,
  timestamp: { type: Date, required: true }
}, { _id: false });

const ArticleSchema = new mongoose.Schema({
  articleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  author: {
    type: String,
    required: true,
    index: true
  },
  // Current/latest version data
  title: { type: String, required: true },
  content: { type: String, required: true },
  ipfsCid: { type: String, required: true },
  contentHash: { type: String, required: true },

  // Article metadata
  trustScore: { type: Number, default: 0 },
  status: { type: Number, default: 0 }, // 0: Submitted, 1: AI Approved, 2: Under Review, 3: Validator Approved, 4: Rejected, 5: Published
  timestamp: { type: Date, required: true, index: true },

  // Voting data
  yesVotes: { type: Number, default: 0 },
  noVotes: { type: Number, default: 0 },

  // Version tracking
  versionCount: { type: Number, default: 1 },
  versions: [ArticleVersionSchema],

  // Cache management
  lastSyncedFromBlockchain: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for faster queries
ArticleSchema.index({ status: 1, timestamp: -1 });
ArticleSchema.index({ trustScore: -1 });
ArticleSchema.index({ author: 1, timestamp: -1 });

// Text index for search functionality
ArticleSchema.index({ title: 'text', content: 'text' });

const Article = mongoose.model('Article', ArticleSchema);

export default Article;
