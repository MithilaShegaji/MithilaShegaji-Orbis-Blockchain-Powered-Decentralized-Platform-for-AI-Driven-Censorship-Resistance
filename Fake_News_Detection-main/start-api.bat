@echo off
echo ========================================
echo Starting Orbis Fake News Detection API
echo ========================================
echo.

REM Check if virtual environment exists
if not exist venv (
    echo Virtual environment not found. Creating one...
    python -m venv venv
    echo.
    echo Installing dependencies...
    call venv\Scripts\activate
    pip install -r requirements-api.txt
    python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
    echo.
    echo Setup complete!
    echo.
) else (
    call venv\Scripts\activate
)

echo Starting API service on port 5000...
echo.
python api_service.py

pause
