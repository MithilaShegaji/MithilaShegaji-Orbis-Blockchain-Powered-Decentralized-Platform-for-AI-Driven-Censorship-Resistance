// clear-pending-tx.js
// Clears pending transactions by replacing them with 0 ETH transfers to self

require('dotenv').config({ path: '../.env' });
const { ethers } = require('ethers');

async function clearPendingTransactions(validatorIndex) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  let privateKey;
  if (validatorIndex === 1) privateKey = process.env.VALIDATOR_PRIVATE_KEY_1;
  else if (validatorIndex === 2) privateKey = process.env.VALIDATOR_PRIVATE_KEY_2;
  else if (validatorIndex === 3) privateKey = process.env.VALIDATOR_PRIVATE_KEY_3;
  else if (validatorIndex === 4) privateKey = process.env.VALIDATOR_PRIVATE_KEY_4;
  else throw new Error('Invalid validator index');

  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Checking pending transactions for validator ${validatorIndex} (${wallet.address})...`);

  const pendingCount = await provider.getTransactionCount(wallet.address, 'pending');
  const minedCount = await provider.getTransactionCount(wallet.address, 'latest');
  const stuckCount = pendingCount - minedCount;

  console.log(`Mined transactions: ${minedCount}`);
  console.log(`Pending transactions: ${pendingCount}`);
  console.log(`Stuck transactions: ${stuckCount}`);

  if (stuckCount === 0) {
    console.log('No stuck transactions!');
    return;
  }

  console.log(`\nClearing ${stuckCount} stuck transaction(s)...`);

  // Get current gas price and increase it by 20%
  const feeData = await provider.getFeeData();
  const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * 120n) / 100n;
  const maxFeePerGas = (feeData.maxFeePerGas * 120n) / 100n;

  for (let nonce = minedCount; nonce < pendingCount; nonce++) {
    console.log(`Replacing transaction at nonce ${nonce}...`);

    try {
      const tx = await wallet.sendTransaction({
        to: wallet.address, // Send to self
        value: 0,
        nonce: nonce,
        maxPriorityFeePerGas,
        maxFeePerGas,
        gasLimit: 21000 // Standard ETH transfer
      });

      console.log(`Replacement tx sent: ${tx.hash}`);
      console.log(`Waiting for confirmation...`);

      await tx.wait();
      console.log(`✓ Nonce ${nonce} cleared`);
    } catch (error) {
      console.error(`Error clearing nonce ${nonce}:`, error.message);
    }
  }

  console.log('\nDone! Check pending count again...');
  const newPendingCount = await provider.getTransactionCount(wallet.address, 'pending');
  const newMinedCount = await provider.getTransactionCount(wallet.address, 'latest');
  console.log(`New pending count: ${newPendingCount}`);
  console.log(`New mined count: ${newMinedCount}`);
}

// Get validator index from command line
const validatorIndex = parseInt(process.argv[2]);

if (!validatorIndex || validatorIndex < 1 || validatorIndex > 4) {
  console.error('Usage: node clear-pending-tx.js <validatorIndex>');
  console.error('Example: node clear-pending-tx.js 3');
  process.exit(1);
}

clearPendingTransactions(validatorIndex).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
