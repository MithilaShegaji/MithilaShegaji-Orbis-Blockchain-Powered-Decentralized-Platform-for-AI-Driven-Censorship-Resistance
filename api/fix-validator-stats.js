// fix-validator-stats.js - Fix corrupted validator stats
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ValidatorStats from './models/ValidatorStats.js';

dotenv.config({ path: '../.env' });

async function fixValidatorStats() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Fix API wallet stats
  const apiWallet = '0x12936e6ba49ba44afcef0efd0af065f12ef40419';
  const validator = await ValidatorStats.findOne({ address: apiWallet });

  if (!validator) {
    console.log('Validator not found!');
    process.exit(1);
  }

  console.log('\n=== BEFORE FIX ===');
  console.log('Address:', validator.address);
  console.log('Total Votes:', validator.totalVotes);
  console.log('Correct Votes:', validator.correctVotes);
  console.log('Wrong Votes:', validator.wrongVotes);
  console.log('Accuracy:', validator.accuracy);
  console.log('Rating:', validator.rating);

  // Fix the totalVotes
  const correctTotal = validator.correctVotes + validator.wrongVotes;
  validator.totalVotes = correctTotal;

  // Recalculate rating
  validator.calculateRating();
  validator.updateVerifiedStatus();
  await validator.save();

  console.log('\n=== AFTER FIX ===');
  console.log('Total Votes:', validator.totalVotes);
  console.log('Accuracy:', validator.accuracy);
  console.log('Rating:', validator.rating);

  console.log('\n✓ Stats fixed successfully!');
  process.exit(0);
}

fixValidatorStats().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
