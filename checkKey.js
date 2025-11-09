// checkKey.js
const { Wallet } = require("ethers");
try {
  const w = new Wallet(process.env.PRIVATE_KEY);
  console.log("Valid key ✅ Address:", w.address);
} catch (e) {
  console.error("Invalid key ❌", e.message);
}
