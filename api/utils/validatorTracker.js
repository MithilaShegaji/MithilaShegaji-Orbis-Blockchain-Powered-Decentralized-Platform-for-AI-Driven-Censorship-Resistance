import ValidatorStats from '../models/ValidatorStats.js';
import { ethers } from 'ethers';

/**
 * Get or create validator stats
 */
async function getOrCreateValidator(address) {
  let validator = await ValidatorStats.findOne({ address: address.toLowerCase() });

  if (!validator) {
    validator = new ValidatorStats({
      address: address.toLowerCase(),
      joinedDate: new Date(),
    });
    await validator.save();
  }

  return validator;
}

/**
 * Update validator stake amount
 */
async function updateValidatorStake(address, stakeAmount) {
  const validator = await getOrCreateValidator(address);
  validator.totalStake = stakeAmount;
  validator.calculateRating();
  validator.updateVerifiedStatus();
  await validator.save();
  return validator;
}

/**
 * Record a vote
 */
async function recordVote(address, articleId) {
  const validator = await getOrCreateValidator(address);
  validator.totalVotes += 1;
  validator.lastVoteDate = new Date();
  await validator.save();
  return validator;
}

/**
 * Record vote outcome (correct or wrong)
 */
async function recordVoteOutcome(address, isCorrect, rewardAmount = '0', penaltyAmount = '0') {
  const validator = await getOrCreateValidator(address);

  // Increment total votes (fixes GUI voting not being tracked)
  validator.totalVotes += 1;

  if (isCorrect) {
    validator.correctVotes += 1;
    validator.consecutiveCorrectVotes += 1;

    // Update total rewards
    const currentRewards = BigInt(validator.totalRewardsEarned);
    const newRewards = currentRewards + BigInt(rewardAmount);
    validator.totalRewardsEarned = newRewards.toString();
  } else {
    validator.wrongVotes += 1;
    validator.consecutiveCorrectVotes = 0;

    // Update total penalties
    const currentPenalties = BigInt(validator.totalPenaltiesPaid);
    const newPenalties = currentPenalties + BigInt(penaltyAmount);
    validator.totalPenaltiesPaid = newPenalties.toString();
  }

  validator.articlesValidated += 1;
  validator.calculateRating();
  validator.updateVerifiedStatus();
  await validator.save();

  return validator;
}

/**
 * Get validator statistics
 */
async function getValidatorStats(address) {
  return await getOrCreateValidator(address);
}

/**
 * Get top validators (leaderboard)
 */
async function getTopValidators(limit = 10) {
  return await ValidatorStats.find()
    .sort({ rating: -1, totalVotes: -1 })
    .limit(limit);
}

/**
 * Get all validators with pagination
 */
async function getAllValidators(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const validators = await ValidatorStats.find()
    .sort({ rating: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ValidatorStats.countDocuments();

  return {
    validators,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Recalculate all validator ratings
 */
async function recalculateAllRatings() {
  const validators = await ValidatorStats.find();

  for (const validator of validators) {
    validator.calculateRating();
    validator.updateVerifiedStatus();
    await validator.save();
  }

  return validators.length;
}

export {
  getOrCreateValidator,
  updateValidatorStake,
  recordVote,
  recordVoteOutcome,
  getValidatorStats,
  getTopValidators,
  getAllValidators,
  recalculateAllRatings,
};
