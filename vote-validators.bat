@echo off
echo ================================================
echo           VALIDATOR VOTING BATCH FILE
echo ================================================
echo.

REM ===== CONFIGURATION =====
REM Change the article ID you want to vote on
set ARTICLE_ID=2

REM Change decisions: true = APPROVE, false = REJECT
set VALIDATOR_1_DECISION=true
set VALIDATOR_2_DECISION=true
set VALIDATOR_3_DECISION=true
set VALIDATOR_4_DECISION=true

echo Voting on Article ID: %ARTICLE_ID%
echo.
echo Validator 1 Decision: %VALIDATOR_1_DECISION% (true=APPROVE, false=REJECT)
echo Validator 2 Decision: %VALIDATOR_2_DECISION% (true=APPROVE, false=REJECT)
echo Validator 3 Decision: %VALIDATOR_3_DECISION% (true=APPROVE, false=REJECT)
echo Validator 4 Decision: %VALIDATOR_4_DECISION% (true=APPROVE, false=REJECT)
echo.
pause
echo.

echo Voting as Validator 1...
curl -X POST http://localhost:4000/articles/%ARTICLE_ID%/vote-validator -H "Content-Type: application/json" -d "{\"decision\": %VALIDATOR_1_DECISION%, \"validatorIndex\": 1}"
echo.
echo.

echo Voting as Validator 2...
curl -X POST http://localhost:4000/articles/%ARTICLE_ID%/vote-validator -H "Content-Type: application/json" -d "{\"decision\": %VALIDATOR_2_DECISION%, \"validatorIndex\": 2}"
echo.
echo.

echo Voting as Validator 3...
curl -X POST http://localhost:4000/articles/%ARTICLE_ID%/vote-validator -H "Content-Type: application/json" -d "{\"decision\": %VALIDATOR_3_DECISION%, \"validatorIndex\": 3}"
echo.
echo.

echo Voting as Validator 4...
curl -X POST http://localhost:4000/articles/%ARTICLE_ID%/vote-validator -H "Content-Type: application/json" -d "{\"decision\": %VALIDATOR_4_DECISION%, \"validatorIndex\": 4}"
echo.
echo.

echo ================================================
echo                VOTING COMPLETE!
echo ================================================
echo Check the frontend to see if article status changed.
echo.
pause