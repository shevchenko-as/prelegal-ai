# Prelegal AI

AI-powered legal document generator. Chat with an AI assistant to create Mutual NDAs, Pilot Agreements, Software License Agreements, and 8 other common legal document types — then download them as PDF.

## Stack

- **Frontend:** Next.js 14 (App Router, TypeScript, Tailwind CSS) — port 3001
- **Backend:** FastAPI + SQLModel + SQLite — port 8000
- **AI:** Groq API (`llama-3.3-70b-versatile`) with tool use

## Prerequisites

- Python 3.10+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

## Setup

### 1. Backend environment

Create `backend/.env`:

```
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=data/prelegal.db
```

### 2. Start the app

```bash
bash scripts/start.sh
```

This will:
- Create a Python virtual environment and install dependencies (first run only)
- Install frontend npm packages (first run only)
- Start both backend and frontend in the background

Open [http://localhost:3001](http://localhost:3001) in your browser.

### 3. Stop the app

```bash
bash scripts/stop.sh
```

## Notes

- The database resets on every backend restart (all users and documents are lost) — this is intentional for the prototype.
- Logs are written to `.backend.log` and `.frontend.log` in the project root.
