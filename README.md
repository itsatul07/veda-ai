# Veda AI - Assessment Generator

An AI-powered assessment generation platform that helps teachers create question papers automatically using AI.

## Features

- **AI-Powered Question Generation** - Upload source material or describe topics, and AI generates relevant questions
- **Multiple Question Types** - Support for MCQ, Short Answer, Long Answer, and True/False
- **Real-time Progress** - Track assignment generation progress via WebSocket
- **User Authentication** - JWT-based login/signup system
- **Dashboard** - View and manage all your assignments
- **PDF Download** - Export question papers and answer keys as PDF

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Socket.IO Client

### Backend
- Node.js
- Express
- MongoDB (MongoDB Atlas)
- BullMQ + Redis (job queue)
- Socket.IO (real-time updates)
- JWT Authentication
- GROQ API (AI question generation)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (for cloud database)
- Redis (for job queue - local or cloud)
- GROQ API key (for AI generation)

### Environment Variables

#### Backend (`backend/.env`)

```env
PORT=3001
MONGODB_URI=mongodb+srv://your-mongodb-uri
JWT_SECRET=your-super-secret-jwt-key
GROQ_API_KEY=your-groq-api-key
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

#### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Installation

```bash
# Clone the repository
git clone https://github.com/itsatul07/veda-ai.git
cd veda-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Locally

```bash
# Start backend (in backend directory)
npm run dev

# Start frontend (in frontend directory)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Backend - Render

1. Created a Web Service on [Render](https://render.com)
2. Connected my GitHub repository
3. Set root directory to `backend`
4. Configure:
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GROQ_API_KEY`
   - `REDIS_URL` (if using Render's Key Value store)
   - `NODE_ENV=production`

### Frontend - Vercel

1. Created a new project on [Vercel](https://vercel.com)
2. Imported my GitHub repository
3. Set root directory to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g., `https://your-backend.onrender.com/api`)
5. Deploy!

## Project Structure

```
veda-ai/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Queue & external services
│   │   └── config/         # Database config
│   └── .env
├── frontend/
│   ├── app/
│   │   ├── auth/           # Login/Signup pages
│   │   ├── dashboard/      # User dashboard
│   │   ├── generate/       # Generation progress page
│   │   └── result/         # Results display page
│   ├── components/         # Reusable UI components
│   ├── lib/               # API client & auth utilities
│   ├── context/           # React Context (Auth)
│   └── store/             # Zustand state store
└── README.md
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assignments` | Create new assignment |
| GET | `/api/assignments/myassignments` | Get user's assignments |
| GET | `/api/assignments/:id` | Get assignment details |
| GET | `/api/assignments/:id/result` | Get assignment result |
| DELETE | `/api/assignments/:id` | Delete assignment |
