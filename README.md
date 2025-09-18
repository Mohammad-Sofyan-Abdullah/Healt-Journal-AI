# Health Journal

An AI-powered personal health tracking and analytics platform that helps users monitor their well-being and receive personalized insights.

## Features

- User authentication and profile management
- Daily health logging (sleep, steps, mood, energy, etc.)
- AI-powered insights and recommendations
- Interactive analytics dashboard
- Health trend visualization
- Anomaly detection and alerts

## Tech Stack

### Frontend
- React.js
- TailwindCSS
- Recharts for data visualization
- Axios for API communication

### Backend
- FastAPI (Python)
- MongoDB for data storage
- Pandas for data analysis
- Motor for async MongoDB operations

## Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 16+
- MongoDB

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv env
   ```
3. Activate the virtual environment:
   - Windows: `env\Scripts\activate`
   - Unix/MacOS: `source env/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Copy `env_example.txt` to `.env` and configure your environment variables
6. Run the server:
   ```bash
   python run.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## API Documentation
- API documentation is available at `http://localhost:8000/docs` when the backend server is running

## License
Mohammad Sofyan Abdullah 
mohammadsofyanabdullah@gmail.com

