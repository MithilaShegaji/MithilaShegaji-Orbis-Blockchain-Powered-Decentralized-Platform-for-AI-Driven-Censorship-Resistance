@echo off
echo ================================================
echo          SEND ETH TO VALIDATORS
echo         (For gas fees - one time)
echo ================================================
echo.

echo This will send 0.01 ETH to each validator for gas fees.
echo Make sure your main wallet has enough ETH first!
echo.

echo Validator addresses:
echo Validator 1: 0xB08943651020aEb372ccd675b6Bdb0af33E6A079
echo Validator 2: 0x3B075E9Ac6b4bD5E4a6F37F4c93F16E37D9F0bCD
echo Validator 3: 0x93f203166798a111958f79d90270DDCB0312da50
echo Validator 4: 0x83e6C3dF62F104BC14ab8d0111a19B6957a4665B
echo.

pause
echo.

echo Sending ETH to validators for gas fees...
curl -X POST http://localhost:4000/fund-validators -H "Content-Type: application/json" -d "{\"amount\": \"0.01\"}"
echo.
echo.

echo ================================================
echo            ETH TRANSFER COMPLETE!
echo ================================================
echo Now validators can pay for gas fees.
echo Run setup-validators.bat again to complete staking.
echo.
pause