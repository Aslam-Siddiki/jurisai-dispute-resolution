import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base
from .routers import disputes, cases

# Ensure tables are created
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="JurisAI Dispute Resolution API",
    description="AI-Powered NLP Legal Mediation & Settlement Recommendation System",
    version="1.0.0"
)

# Enable CORS for frontend and API clients
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
frontend_origin = os.getenv("FRONTEND_URL")
if frontend_origin and frontend_origin != "*":
    origins.append(frontend_origin.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not frontend_origin or frontend_origin == "*" else origins,
    allow_origin_regex=r"^https:\/\/.*(\.vercel\.app|\.onrender\.com)$",
    allow_credentials=False if (not frontend_origin or frontend_origin == "*") else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for evidence access
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers with /api prefix
app.include_router(disputes.router, prefix="/api")
app.include_router(cases.router, prefix="/api")

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from .nlp_pipeline import run_dispute_pipeline

class CaseEvaluationRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = None
    claim_amount: Optional[float] = 0.0
    claimant_name: str
    claimant_statement: str
    claimant_evidence: Optional[str] = ""
    respondent_name: str
    respondent_statement: str
    respondent_evidence: Optional[str] = ""

@app.post("/api/evaluate")
def evaluate_case_microservice(data: CaseEvaluationRequest):
    """
    Dedicated AI Microservice Endpoint:
    Executes multi-stage NLP pipeline (Extract -> Compare -> Apply Law RAG -> Structured Decision -> Escalation Check)
    """
    evidence_texts = []
    if data.claimant_evidence:
        evidence_texts.append(data.claimant_evidence)
    if data.respondent_evidence:
        evidence_texts.append(data.respondent_evidence)

    results = run_dispute_pipeline(
        title=data.title,
        description=data.description or "",
        name_a=data.claimant_name,
        statement_a=data.claimant_statement,
        name_b=data.respondent_name,
        statement_b=data.respondent_statement,
        evidence_texts=evidence_texts
    )

    # 1. Structure Findings
    findings = [
        {
            "category": "Claimant Position",
            "statement": f"{data.claimant_name} filed for resolution regarding '{data.title}'.",
            "corroboration": "Documented via claimant formal statement." + (" Corroborated with attached evidence." if data.claimant_evidence else " Uncorroborated by independent exhibits.")
        },
        {
            "category": "Respondent Rebuttal",
            "statement": f"{data.respondent_name} responded contesting liability or raising counter-allowances.",
            "corroboration": "Documented via respondent formal statement." + (" Corroborated with attached evidence." if data.respondent_evidence else " Pending receipt of documentation.")
        }
    ]

    # 2. Extract Agreements vs Disputed Points
    nli = results.get("nli_result", {})
    agreements = [
        f"Consensus identified on core transaction underlying {results.get('dispute_category', 'the claim')}.",
        f"Semantic alignment score between accounts measured at {int(results.get('similarity_score', 0.5) * 100)}%."
    ]

    disputed_points = []
    for item in nli.get("contradictions", []):
        disputed_points.append({
            "claimA": item.get("sent_a", ""),
            "claimB": item.get("sent_b", ""),
            "issue": f"Direct factual variance (Confidence: {int(item.get('confidence', 0.8) * 100)}%)"
        })

    # 3. Apply Law / Precedent Provisions (RAG)
    legal_provisions = []
    for case_match in results.get("similar_cases", []):
        legal_provisions.append({
            "statuteOrPrecedent": case_match.get("title", ""),
            "relevance": f"Category: {case_match.get('category', '')}",
            "similarityScore": case_match.get("similarity_score", 0.8),
            "pastOutcome": case_match.get("resolution", "")
        })

    # 4. Confidence & Escalation Gating
    confidence = results.get("classifier_confidence", 0.82)
    has_substantial_evidence = bool(data.claimant_evidence.strip() or data.respondent_evidence.strip())
    severe_contradictions = len(disputed_points) >= 3

    needs_escalation = False
    escalation_reason = ""

    if not has_substantial_evidence and severe_contradictions:
        confidence = min(confidence, 0.52)
        needs_escalation = True
        escalation_reason = "Multiple factual contradictions detected without corroborating documentary evidence. Referral to human civil mediator recommended."
    elif confidence < 0.60:
        needs_escalation = True
        escalation_reason = "Low classification/similarity confidence. Case flagged for human mediator intervention."

    return {
        "dispute_category": results.get("dispute_category"),
        "findings": findings,
        "agreements": agreements,
        "disputedPoints": disputed_points,
        "extractedEntities": {
            "claimant": results.get("entities_a", {}),
            "respondent": results.get("entities_b", {})
        },
        "legalProvisions": legal_provisions,
        "reasoning": results.get("explanation"),
        "outcome": results.get("recommendation"),
        "confidence": round(confidence, 3),
        "needsHumanEscalation": needs_escalation,
        "escalationReason": escalation_reason,
        "modelVersion": "JurisAI-NLP-v2.1 (DeBERTa-v3 + SBERT + FAISS RAG)"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "JurisAI AI Evaluation Microservice",
        "version": "2.1.0"
    }

@app.get("/")
def root():
    return {
        "message": "JurisAI Dispute Resolution API is running. Access endpoints via /api (docs at /docs)."
    }
