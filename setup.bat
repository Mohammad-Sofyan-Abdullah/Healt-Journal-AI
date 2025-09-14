@echo off
echo Setting up AI-Powered Personal Health Journal...
echo.

echo Setting up Backend...
cd backend
echo Creating virtual environment...
python -m venv venv
echo Activating virtual environment...
call venv\Scripts\activate
echo Installing Python dependencies...
pip install -r requirements.txt
echo Backend setup complete!
echo.

echo Setting up Frontend...
cd ..\frontend
echo Installing Node.js dependencies...
npm install
echo Frontend setup complete!
echo.

echo Setup complete! 
echo.
echo To start the application:
echo 1. Run start_backend.bat to start the API server
echo 2. Run start_frontend.bat to start the React app
echo.
echo Don't forget to:
echo - Set up MongoDB (local or cloud)
echo - Get a Groq API key
echo - Configure environment variables in backend/.env
echo.
pause
