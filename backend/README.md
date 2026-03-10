# MindSense Backend

Backend API for MindSense - Real-Time Mental Health Early-Warning System

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your database credentials and secret key
```

5. Set up PostgreSQL database:
```bash
# Create a database named 'mindsense'
# Update DATABASE_URL in .env with your credentials
```

6. Run the application:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### Health
- `GET /health` - Health check

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── database.py          # Database configuration
├── models.py            # SQLAlchemy models
├── schemas.py           # Pydantic schemas
├── auth_utils.py        # JWT authentication utilities
├── routers/             # API route handlers
│   ├── auth.py          # Authentication endpoints
│   └── health.py        # Health check endpoint
└── requirements.txt     # Python dependencies
```
