#  LYProject - Local Development Setup

This guide explains how to run the project locally after cloning the repository.

---

# Project Structure

```
LYProject/
│
├── client/         # React Frontend
├── server/         # Node.js + Express Backend
└── ml_service/     # FastAPI ML Service
```

---

# Prerequisites

Make sure the following are installed:

- Node.js (v18+ recommended)
- npm
- Python 3.12+
- Git

Verify:

```bash
node -v
npm -v
python --version
```

---

# 1. Clone the Repository

```bash
git clone <repo-url>
cd LYProject
```

---

# 2. Backend Setup (Express)

```bash
cd server
npm install
```

Create your `.env` file inside `server/` and add the required environment variables.

Example:

```env
PORT=5000
MONGODB_URI=...
JWT_SECRET=...
ML_SERVICE_URL=http://127.0.0.1:8000
```

Start the backend:

```bash
npm start
```

The backend should start on:

```
http://localhost:5000
```

Leave this terminal running.

---

# 3. Frontend Setup (React)

Open a new terminal.

```bash
cd client
npm install
npm run dev
```

The frontend will start on something like:

```
http://localhost:5173
```

Leave this terminal running.

---

# 4. ML Service Setup (FastAPI)

Open another terminal.

```bash
cd ml_service
```

## Create a Virtual Environment

### Windows

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

If activation succeeds, your terminal will look like:

```text
(.venv) PS D:\...\ml_service>
```

---

### macOS/Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

## Install Python Dependencies

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

---

## Start the ML Service

```bash
python -m uvicorn app:app --reload --port 8000
```

You should see:

```text
INFO: Uvicorn running on http://127.0.0.1:8000
INFO: Application startup complete.
```

Keep this terminal running.

---

# 5. Verify the ML Service

Open your browser:

```
http://127.0.0.1:8000/health
```

or

```bash
curl http://127.0.0.1:8000/health
```

You should receive a JSON response indicating the service is healthy.

---

# Manual Testing

1. Start all three services:
   - Frontend
   - Backend
   - ML Service

2. Log in.

3. Add at least **3 income entries**.

4. Open the Dashboard.

5. Click **Refresh**.

Verify that the dashboard displays:

-  Forecast Total
-  Volatility Label
-  Income Entry Count

---

# Running the Project Next Time

After the initial setup, you **do not need to recreate the virtual environment**.

### Terminal 1

```bash
cd server
npm start
```

### Terminal 2

```bash
cd client
npm run dev
```

### Terminal 3

```powershell
cd ml_service
.\.venv\Scripts\Activate.ps1
python -m uvicorn app:app --reload --port 8000
```

---

# If You Add New Python Packages

After installing a package:

```bash
python -m pip install <package>
```

Update `requirements.txt`:

```bash
python -m pip freeze > requirements.txt
```

Commit the updated `requirements.txt`.

---

# Troubleshooting

## `ModuleNotFoundError`

Make sure the virtual environment is activated:

```powershell
.\.venv\Scripts\Activate.ps1
```

Then reinstall:

```bash
python -m pip install -r requirements.txt
```

---

## `uvicorn` is not recognized

Always use:

```bash
python -m uvicorn app:app --reload --port 8000
```

instead of:

```bash
uvicorn app:app --reload
```

---

## React cannot connect to backend

Verify:

- Backend is running
- `.env` is correct
- API URL is correct

---

## Backend cannot connect to ML Service

Verify:

```
http://127.0.0.1:8000/health
```

is reachable.

Also ensure:

```env
ML_SERVICE_URL=http://127.0.0.1:8000
```

matches your backend configuration.

---

# Development Workflow

Whenever you work on the project:

1. Start the Backend
2. Start the Frontend
3. Activate the Python virtual environment
4. Start the ML Service

All three services must be running for the analytics features to function correctly.