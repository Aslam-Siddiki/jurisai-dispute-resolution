# JurisAI Production Deployment Guide

This guide covers deploying the JurisAI 3-tier architecture:
1. **Frontend**: React 19 + Vite
2. **Core API**: Node.js + Express + Mongoose
3. **AI Engine**: Python FastAPI + Scikit-learn + PyMuPDF
4. **Database**: MongoDB Atlas + SQLite / PostgreSQL

---

## Architecture Topology

```
                  ┌──────────────────────┐
                  │    User Browser      │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   ┌───────────────────┐             ┌───────────────────┐
   │ React Vite Web    │             │ Direct Gmail Compose
   │ (Vercel / Netlify)│             │ (Web Mail Direct)  │
   └────────┬──────────┘             └───────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────┐
   │ Node.js MERN Core API (Port 5000)        │
   │ (Render / Railway / DigitalOcean)        │
   └──────────┬────────────────────┬──────────┘
              │                    │
              ▼                    ▼
   ┌───────────────────────┐  ┌───────────────────────────────────┐
   │ MongoDB Atlas Cloud   │  │ Python AI Engine (Port 8000)     │
   │ (Managed Database)    │  │ (Render / Railway / FastAPI)      │
   └───────────────────────┘  └───────────────────────────────────┘
```

---

## Recommended Deployment Approaches

### Approach A: Cloud PaaS (Fastest, zero-devops setup)

| Tier | Recommended Host | Free Tier Available? | Setup |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) / [Netlify](https://netlify.com) | Yes | Connect GitHub repo, set root dir to `frontend`, build command `npm run build`, publish dir `dist`. |
| **Node API** | [Render](https://render.com) / [Railway](https://railway.app) | Yes | Web Service, root dir `server`, start command `npm start`. |
| **Python AI Engine** | [Render](https://render.com) / [Railway](https://railway.app) | Yes | Web Service, root dir `.`, start command `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000`. |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Yes (512MB free M0) | Create free cluster, whitelist IP `0.0.0.0/0`, obtain connection string. |

#### Environment Variables Checklist

**1. Node Backend (`server/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/jurisai?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
PYTHON_AI_URL=https://<your-python-service>.onrender.com
FRONTEND_URL=https://<your-frontend>.vercel.app
```

**2. Python AI Backend (`backend/.env`):**
```env
PORT=8000
FRONTEND_URL=https://<your-frontend>.vercel.app
# Optional SMTP credentials (if you want direct background email sending):
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASSWORD=your_google_app_password
```

---

### Approach B: All-in-One Cloud VPS (DigitalOcean / Hetzner / AWS Lightsail)

For $6-$10/month on a Linux VPS (Ubuntu 22.04 LTS), you can run all services with Docker Compose or PM2 + Nginx.

#### Quick PM2 + Nginx Setup on Ubuntu VPS:
1. **Install Node, Python, and Nginx**:
   ```bash
   sudo apt update && sudo apt install -y nodejs npm python3-pip python3-venv nginx
   npm install -g pm2
   ```

2. **Clone & Setup Backend Services**:
   ```bash
   git clone <your-repo-url> /var/www/jurisai
   cd /var/www/jurisai

   # Setup Python virtualenv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Setup Node Server
   cd /var/www/jurisai/server
   npm install

   # Setup Frontend build
   cd /var/www/jurisai/frontend
   npm install
   npm run build
   ```

3. **Start with PM2**:
   ```bash
   # Start Python AI backend
   pm2 start "venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000" --name "jurisai-python"

   # Start Node Core backend
   cd /var/www/jurisai/server
   pm2 start index.js --name "jurisai-node"

   pm2 save
   pm2 startup
   ```

4. **Nginx Reverse Proxy & SSL (Certbot)**:
   Point port 80/443 to the built frontend files in `frontend/dist`, and reverse proxy `/api` calls to Node (`localhost:5000`) and `/api/disputes` or Python docs to Python (`localhost:8000`). Run `sudo certbot --nginx` to enable free HTTPS!
