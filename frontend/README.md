# MindSense Frontend

Next.js frontend for MindSense - Real-Time Mental Health Early-Warning System

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run development server:
```bash
npm run dev
```

Visit `http://localhost:3000`

## Features

- User authentication (login/register)
- Risk assessment dashboard
- Behavioral data submission
- Real-time risk scoring

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- React

## Pages

- `/` - Home (redirects to login)
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Main dashboard with risk assessment

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000`. Make sure the backend is running before using the frontend.
