@echo off
echo ================================================
echo        VALIDATOR SETUP (MINT + STAKE)
echo            RUN THIS ONLY ONCE!
echo ================================================
echo.

echo This will mint 1000 NEWS tokens and stake 100 for each validator.
echo Make sure your API is running first!
echo.
pause
echo.

echo ===== MINTING TOKENS =====
echo.

echo Minting 1000 NEWS for Validator 1...
curl -X POST http://localhost:4000/mint-validator -H "Content-Type: application/json" -d "{\"amount\": \"1000\", \"validatorIndex\": 1}"
echo.
echo.

echo Minting 1000 NEWS for Validator 2...
curl -X POST http://localhost:4000/mint-validator -H "Content-Type: application/json" -d "{\"amount\": \"1000\", \"validatorIndex\": 2}"
echo.
echo.

echo Minting 1000 NEWS for Validator 3...
curl -X POST http://localhost:4000/mint-validator -H "Content-Type: application/json" -d "{\"amount\": \"1000\", \"validatorIndex\": 3}"
echo.
echo.

echo Minting 1000 NEWS for Validator 4...
curl -X POST http://localhost:4000/mint-validator -H "Content-Type: application/json" -d "{\"amount\": \"1000\", \"validatorIndex\": 4}"
echo.
echo.

echo ===== STAKING TOKENS =====
echo.

echo Staking 100 NEWS for Validator 1...
curl -X POST http://localhost:4000/stake-validator -H "Content-Type: application/json" -d "{\"amount\": \"100\", \"validatorIndex\": 1}"
echo.
echo.

echo Staking 100 NEWS for Validator 2...
curl -X POST http://localhost:4000/stake-validator -H "Content-Type: application/json" -d "{\"amount\": \"100\", \"validatorIndex\": 2}"
echo.
echo.

echo Staking 100 NEWS for Validator 3...
curl -X POST http://localhost:4000/stake-validator -H "Content-Type: application/json" -d "{\"amount\": \"100\", \"validatorIndex\": 3}"
echo.
echo.

echo Staking 100 NEWS for Validator 4...
curl -X POST http://localhost:4000/stake-validator -H "Content-Type: application/json" -d "{\"amount\": \"100\", \"validatorIndex\": 4}"
echo.
echo.

echo ================================================
echo            SETUP COMPLETE!
echo ================================================
echo All validators now have tokens and stakes.
echo You can now use vote-validators.bat to vote!
echo.
pause