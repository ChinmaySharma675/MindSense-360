# 🚀 MindSense Deployment & Hosting Guide

This document explains how to deploy the **MindSense** application to production.

MindSense supports multiple deployment options:

* **Lovable (Recommended – fastest setup)**
* **Vercel (Frontend hosting)**
* **Render (Backend + Database hosting)**

---

# 📋 Prerequisites

Before deploying, ensure you have:

* GitHub repository containing the project
* Node.js installed (for frontend development)
* Python installed (for backend)
* Accounts on deployment platforms if deploying manually

Recommended accounts:

* GitHub
* Vercel
* Render

---

# 🟣 Option 1: Deploy using Lovable (Recommended)

MindSense can be deployed easily using Lovable.

### Steps

1. Log in to your Lovable dashboard.
2. Import the **MindSense GitHub repository**.
3. Configure any required environment variables.
4. Click **Deploy**.
5. Lovable automatically provisions hosting and deployment.

Once deployment is complete, Lovable will generate a **public URL** where the application can be accessed.

This is the **simplest way to deploy MindSense**.

---

# 🟢 Option 2: Manual Deployment (Render + Vercel)

If you prefer full control over hosting, you can deploy the backend and frontend separately.

Architecture:

```
User
 ↓
Frontend (Next.js - Vercel)
 ↓
Backend API (FastAPI - Render)
 ↓
PostgreSQL Database (Render)
```

---

# 🟠 Backend Deployment (Render)

## 1. Create PostgreSQL Database

1. Log in to the Render Dashboard.
2. Click **New → PostgreSQL**.
3. Configure:

Name:

```
mindsense-db
```

Plan:

```
Free (for development)
```

4. Click **Create Database**.
5. Copy the **Internal Database URL**.

---

## 2. Deploy Backend Service

1. In Render Dashboard click **New → Web Service**.
2. Connect your GitHub repository.
3. Configure:

Name

```
mindsense-backend
```

Root Directory

```
backend
```

Runtime

```
Python 3
```

Build Command

```
pip install -r requirements.txt
```

Start Command

```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 3. Configure Environment Variables

Add the following environment variables:

```
DATABASE_URL=<your render database url>
SECRET_KEY=<random secure string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=<your frontend url>
```

Example:

```
ALLOWED_ORIGINS=https://mindsense.vercel.app
```

Deploy the service.

After deployment, you will receive a backend URL like:

```
https://mindsense-backend.onrender.com
```

---

# 🔵 Frontend Deployment (Vercel)

1. Log in to the Vercel dashboard.
2. Click **Add New → Project**.
3. Import the GitHub repository.

### Configure Project Settings

Framework

```
Next.js
```

Root Directory

```
frontend
```

---

## Environment Variables

Add:

```
NEXT_PUBLIC_API_URL=<backend url>
```

Example:

```
NEXT_PUBLIC_API_URL=https://mindsense-backend.onrender.com
```

---

## Deploy

Click **Deploy**.

After deployment you will receive a URL like:

```
https://mindsense.vercel.app
```

---

# 🔧 Final Configuration

After frontend deployment:

1. Copy the Vercel frontend URL.
2. Go back to **Render Dashboard**.
3. Update the backend environment variable:

```
ALLOWED_ORIGINS=<your vercel url>
```

Example:

```
ALLOWED_ORIGINS=https://mindsense.vercel.app
```

Redeploy the backend if necessary.

---

# ✅ Deployment Verification

To verify everything works:

1. Open the frontend URL.
2. Register a new account.
3. Test API interactions.
4. Confirm database records are being created.

If successful, your MindSense application is live.

---

# 🛠 Troubleshooting

## Frontend cannot reach backend

Check:

* `NEXT_PUBLIC_API_URL` is correct
* Backend service is running
* CORS settings allow frontend domain

---

## Database connection error

Verify:

* `DATABASE_URL` is correct
* PostgreSQL service is active

---

# 📌 Notes

* Free hosting tiers may cause backend **cold starts**.
* For production environments consider upgrading hosting plans.

---

# 🎉 Congratulations

Your **MindSense application is now deployed and accessible online.**
