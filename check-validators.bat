@echo off
echo ================================================
echo         VALIDATOR STATUS CHECK
echo ================================================
echo.

echo Checking validator addresses and staking status...
echo.

echo Getting validator info from API...
curl -X GET http://localhost:4000/health
echo.
echo.

echo You should see in your API console:
echo - Total validators configured: 5
echo - Added validator 3: 0x...
echo - Added validator 4: 0x...
echo.

echo Check your API console logs for any errors during minting/staking.
echo.
pause