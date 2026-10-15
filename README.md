# JurisAI — AI-Based Civil Dispute Resolution System

An AI-powered, non-binding digital mediation platform for resolving small civil disputes objectively and transparently.

## Project Structure

```
AI_PROJECT/
├── backend/               # FastAPI Python Backend
│   ├── main.py            # FastAPI app with CORS and routers
│   ├── database.py        # SQLite engine and session factory
│   ├── models.py          # SQLAlchemy ORM models
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── nlp_pipeline.py    # 6-stage NLP AI mediation engine
│   ├── reference_cases.py # 10 precedent cases + TF-IDF search
│   └── routers/
│       ├── disputes.py    # Dispute CRUD, evidence upload, AI trigger
│       └── cases.py       # Reference precedent case knowledge base
├── frontend/              # React 19 + Vite Web Application
│   └── src/
│       ├── pages/
│       │   ├── HomePage.jsx         # Feature showcase landing page
│       │   ├── NewDisputePage.jsx   # Multi-step dispute filing
│       │   ├── DisputeDetailPage.jsx # AI analysis results display
│       │   ├── DisputeListPage.jsx  # All disputes directory
│       │   └── ReferenceCasesPage.jsx # Precedent case search
│       └── components/
│           └── Navbar.jsx
├── uploads/               # Uploaded evidence files (auto-created)
├── dispute.db             # SQLite database
├── main.py                # Uvicorn launcher (python main.py)
├── start.bat              # One-click Windows startup script
└── requirements.txt       # Python dependencies
```

## Quick Start

### Option 1 — Double-click `start.bat` (Windows)
Automatically starts both backend and frontend servers.

### Option 2 — Manual Start

**Backend:**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend** (in a separate terminal):
```bash
cd frontend
npx vite --port 5173 --host 127.0.0.1
```

Then open **http://localhost:5173** in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/disputes` | List all disputes |
| POST | `/api/disputes` | Create new dispute |
| GET | `/api/disputes/{id}` | Get dispute details |
| POST | `/api/disputes/{id}/party-a` | Submit Party A statement |
| POST | `/api/disputes/{id}/party-b` | Submit Party B statement |
| POST | `/api/disputes/{id}/evidence` | Upload evidence file (PDF/TXT) |
| POST | `/api/disputes/{id}/analyze` | Trigger AI pipeline analysis |
| GET | `/api/disputes/{id}/analysis` | Get analysis results |
| POST | `/api/disputes/{id}/respond` | Record party acceptance/rejection |
| GET | `/api/cases/reference` | Get 10 precedent cases |
| GET | `/api/health` | Health check |
| GET | `/docs` | Swagger interactive API docs |

## AI Pipeline Stages

1. **Domain Classification** — Categorizes disputes into Rental/Deposit, Contract, Loan/Debt, Property Damage, Employment, or Goods & Services
2. **Fact Extraction (NER)** — Extracts monetary amounts, dates, and deadlines from statements
3. **Semantic Similarity** — Measures cosine consensus between Party A and Party B (TF-IDF)
4. **Contradiction Analysis** — Identifies direct factual conflicts between opposing statements
5. **Precedent Retrieval** — Finds closest historical case matches from the knowledge base
6. **Settlement Synthesis** — Generates a structured neutral compromise proposal with full reasoning

## Tech Stack

**Backend:** Python 3.13, FastAPI, SQLAlchemy, SQLite, PyMuPDF, Scikit-learn  
**Frontend:** React 19, Vite 8, React Router, Axios, Lucide React  
**AI/NLP:** TF-IDF Vectorizer, Cosine Similarity, Regex NER, Rule-based NLI
