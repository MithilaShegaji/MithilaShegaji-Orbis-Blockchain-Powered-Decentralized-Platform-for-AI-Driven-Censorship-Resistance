import mongoose from 'mongoose';

const validatorStatsSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  totalVotes: {
    type: Number,
    default: 0,
  },
  correctVotes: {
    type: Number,
    default: 0,
  },
  wrongVotes: {
    type: Number,
    default: 0,
  },
  articlesValidated: {
    type: Number,
    default: 0,
  },
  totalStake: {
    type: String,
    default: '0',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  lastVoteDate: {
    type: Date,
  },
  totalRewardsEarned: {
    type: String,
    default: '0',
  },
  totalPenaltiesPaid: {
    type: String,
    default: '0',
  },
  verified: {
    type: Boolean,
    default: false,
  },
  consecutiveCorrectVotes: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Calculate accuracy percentage
validatorStatsSchema.virtual('accuracy').get(function() {
  if (this.totalVotes === 0) return 0;
  return (this.correctVotes / this.totalVotes) * 100;
});

// Calculate participation rate (based on total articles vs votes cast)
validatorStatsSchema.virtual('participationRate').get(function() {
  if (this.articlesValidated === 0) return 100;
  return Math.min((this.totalVotes / this.articlesValidated) * 100, 100);
});

// Method to update rating based on performance
validatorStatsSchema.methods.calculateRating = function() {
  const accuracy = this.accuracy;
  const participationRate = this.participationRate;
  const stakeWeight = Math.min(parseFloat(this.totalStake) / (500 * 1e18), 1); // Max weight at 500 NEWS

  // Days since joined
  const daysSinceJoined = (Date.now() - this.joinedDate.getTime()) / (1000 * 60 * 60 * 24);
  const tenureBonus = Math.min(daysSinceJoined / 90, 1); // Max bonus at 90 days

  // Weighted rating formula
  const rating = (
    (accuracy / 100) * 0.5 +        // 50% weight on accuracy
    stakeWeight * 0.25 +              // 25% weight on stake amount
    (participationRate / 100) * 0.15 + // 15% weight on participation
    tenureBonus * 0.1                 // 10% weight on tenure
  ) * 5;

  this.rating = Math.min(Math.max(rating, 0), 5); // Clamp between 0-5
  return this.rating;
};

// Method to check if validator qualifies for verified badge
validatorStatsSchema.methods.updateVerifiedStatus = function() {
  const requirements = {
    minStake: 500 * 1e18,
    minRating: 4.0,
    minVotes: 50,
    minAccuracy: 85,
    minTenureDays: 90,
  };

  const daysSinceJoined = (Date.now() - this.joinedDate.getTime()) / (1000 * 60 * 60 * 24);

  this.verified = (
    parseFloat(this.totalStake) >= requirements.minStake &&
    this.rating >= requirements.minRating &&
    this.totalVotes >= requirements.minVotes &&
    this.accuracy >= requirements.minAccuracy &&
    daysSinceJoined >= requirements.minTenureDays
  );

  return this.verified;
};

validatorStatsSchema.set('toJSON', { virtuals: true });
validatorStatsSchema.set('toObject', { virtuals: true });

const ValidatorStats = mongoose.model('ValidatorStats', validatorStatsSchema);

export default ValidatorStats;
