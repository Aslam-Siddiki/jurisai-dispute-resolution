import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Dispute, Party, EvidenceFile, AnalysisResult, generate_token
from ..schemas import (
    DisputeCreate, DisputeRegisterRequest, DisputeResponse, DisputeListItem,
    PartyCreate, PartyResponse, PartyBRespondRequest, SendInviteRequest, InviteInfoResponse,
    EvidenceFileResponse,
    RespondRequest
)
from ..nlp_pipeline import run_dispute_pipeline
from ..email_service import send_invitation_email

# Upload directory in AI_PROJECT root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

import requests

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")

def relay_broadcast(event: str, data: dict):
    """Notify Node.js core server to broadcast SSE event to all connected dashboard clients."""
    try:
        requests.post(f"{NODE_BACKEND_URL}/api/realtime/broadcast", json={"event": event, "data": data}, timeout=1.0)
    except Exception:
        pass

router = APIRouter(prefix="/disputes", tags=["disputes"])

def extract_text_from_file(saved_path: str, ext: str, file_bytes: bytes) -> str:
    extracted_text = ""
    try:
        if ext == ".pdf":
            import fitz
            doc = fitz.open(saved_path)
            for page in doc:
                extracted_text += page.get_text() + "\n"
        elif ext in [".txt", ".csv", ".json", ".md"]:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Error extracting text from {saved_path}: {e}")
    return extracted_text.strip()

@router.get("", response_model=List[DisputeListItem])
def list_disputes(db: Session = Depends(get_db)):
    """
    List all disputes ordered by creation date descending with party names.
    """
    disputes = db.query(Dispute).order_by(Dispute.created_at.desc()).all()
    results = []
    for d in disputes:
        party_a = next((p for p in d.parties if p.role == "A"), None)
        party_b = next((p for p in d.parties if p.role == "B"), None)
        results.append(DisputeListItem(
            id=d.id,
            title=d.title,
            description=d.description,
            category=d.category,
            invite_token=d.invite_token,
            status=d.status,
            created_at=d.created_at,
            updated_at=d.updated_at,
            party_a_name=party_a.name if party_a else None,
            party_a_email=party_a.email if party_a else None,
            party_b_name=party_b.name if party_b else None,
            party_b_email=party_b.email if party_b else None,
        ))
    return results

@router.post("/register")
def register_dispute(data: DisputeRegisterRequest, db: Session = Depends(get_db)):
    """
    New unified dispute registration flow:
    Party A files a dispute against Party B, provides their statement,
    and invites Party B via email & invite URL to resolve the issue.
    """
    token = generate_token()
    new_dispute = Dispute(
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        category=data.category.strip() if data.category else None,
        invite_token=token,
        status="pending"
    )
    db.add(new_dispute)
    db.flush()

    # Create Party A (Claimant)
    party_a = Party(
        dispute_id=new_dispute.id,
        role="A",
        name=data.party_a_name.strip(),
        email=data.party_a_email.strip() if data.party_a_email else None,
        statement=data.party_a_statement.strip()
    )
    db.add(party_a)

    # Create Party B (Respondent - Pending Invitation)
    party_b = Party(
        dispute_id=new_dispute.id,
        role="B",
        name=data.party_b_name.strip(),
        email=data.party_b_email.strip() if data.party_b_email else None,
        statement=None,
        invited_at=datetime.utcnow()
    )
    db.add(party_b)
    db.commit()
    db.refresh(new_dispute)

    invite_url = f"{FRONTEND_URL}/invite/{new_dispute.invite_token}"

    email_status = None
    if data.send_email and data.party_b_email:
        email_status = send_invitation_email(
            party_b_email=data.party_b_email.strip(),
            party_b_name=data.party_b_name.strip(),
            party_a_name=data.party_a_name.strip(),
            dispute_title=new_dispute.title,
            invite_url=invite_url
        )

    relay_broadcast("CASE_CREATED", {
        "id": new_dispute.id,
        "title": new_dispute.title,
        "party_a_name": data.party_a_name,
        "party_b_name": data.party_b_name,
        "message": f"New dispute filed: '{new_dispute.title}'"
    })

    return {
        "message": "Dispute registered successfully and invitation created for Party B",
        "dispute_id": new_dispute.id,
        "invite_token": new_dispute.invite_token,
        "invite_url": invite_url,
        "email_status": email_status,
        "dispute": new_dispute
    }

@router.post("/{dispute_id}/invite-party-b")
def invite_party_b(dispute_id: str, data: SendInviteRequest, db: Session = Depends(get_db)):
    """
    Send or re-send email invitation and generate invite URL for Party B.
    """
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    party_a = db.query(Party).filter(Party.dispute_id == dispute_id, Party.role == "A").first()
    party_b = db.query(Party).filter(Party.dispute_id == dispute_id, Party.role == "B").first()

    if not party_b:
        party_b = Party(
            dispute_id=dispute_id,
            role="B",
            name=data.party_b_name.strip() if data.party_b_name else "Party B",
            email=data.party_b_email.strip() if data.party_b_email else None,
            invited_at=datetime.utcnow()
        )
        db.add(party_b)
    else:
        if data.party_b_name:
            party_b.name = data.party_b_name.strip()
        if data.party_b_email:
            party_b.email = data.party_b_email.strip()
        party_b.invited_at = datetime.utcnow()

    # Ensure dispute has invite token
    if not dispute.invite_token:
        dispute.invite_token = generate_token()

    db.commit()
    db.refresh(party_b)
    db.refresh(dispute)

    invite_url = f"{FRONTEND_URL}/invite/{dispute.invite_token}"
    email_status = None

    if party_b.email:
        email_status = send_invitation_email(
            party_b_email=party_b.email,
            party_b_name=party_b.name,
            party_a_name=party_a.name if party_a else "The Claimant",
            dispute_title=dispute.title,
            invite_url=invite_url
        )

    return {
        "success": True,
        "invite_url": invite_url,
        "email_status": email_status,
        "party_b": party_b
    }

@router.get("/invite/{invite_token}", response_model=InviteInfoResponse)
def get_invite_info(invite_token: str, db: Session = Depends(get_db)):
    """
    Public portal endpoint: Party B opens the invitation link to see the dispute claim
    filed against them and review Party A's statement and evidence before responding.
    """
    dispute = db.query(Dispute).filter(Dispute.invite_token == invite_token).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation link")

    party_a = db.query(Party).filter(Party.dispute_id == dispute.id, Party.role == "A").first()
    party_b = db.query(Party).filter(Party.dispute_id == dispute.id, Party.role == "B").first()
    evidence_files = db.query(EvidenceFile).filter(EvidenceFile.dispute_id == dispute.id).all()

    has_responded = bool(party_b and party_b.statement and party_b.statement.strip())

    return InviteInfoResponse(
        dispute_id=dispute.id,
        title=dispute.title,
        description=dispute.description,
        category=dispute.category,
        status=dispute.status,
        created_at=dispute.created_at,
        invite_token=dispute.invite_token,
        party_a=PartyResponse.from_orm(party_a) if party_a else None,
        party_b=PartyResponse.from_orm(party_b) if party_b else None,
        has_responded=has_responded,
        evidence_files=[EvidenceFileResponse.from_orm(ev) for ev in evidence_files]
    )

@router.post("/invite/{invite_token}/respond")
def submit_party_b_by_invite(invite_token: str, data: PartyBRespondRequest, db: Session = Depends(get_db)):
    """
    Party B submits their formal response statement via the invitation link.
    Transitions dispute to 'submitted' so AI mediation can commence.
    """
    dispute = db.query(Dispute).filter(Dispute.invite_token == invite_token).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Invalid invitation link")

    party_b = db.query(Party).filter(Party.dispute_id == dispute.id, Party.role == "B").first()
    if not party_b:
        party_b = Party(
            dispute_id=dispute.id,
            role="B",
            name=data.name.strip() if data.name else "Party B",
            email=data.email.strip() if data.email else None,
            statement=data.statement.strip(),
            responded_at=datetime.utcnow()
        )
        db.add(party_b)
    else:
        if data.name and data.name.strip():
            party_b.name = data.name.strip()
        if data.email and data.email.strip():
            party_b.email = data.email.strip()
        party_b.statement = data.statement.strip()
        party_b.responded_at = datetime.utcnow()

    party_a = db.query(Party).filter(Party.dispute_id == dispute.id, Party.role == "A").first()
    if party_a and party_a.statement:
        dispute.status = "submitted"
    dispute.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(party_b)
    db.refresh(dispute)

    relay_broadcast("CASE_UPDATED", {
        "id": dispute.id,
        "title": dispute.title,
        "status": dispute.status,
        "message": f"Party B ({party_b.name}) submitted response for '{dispute.title}'"
    })

    return {
        "message": "Response submitted successfully. Both parties have submitted their accounts.",
        "dispute_id": dispute.id,
        "dispute_status": dispute.status,
        "party_b": party_b
    }

@router.post("/invite/{invite_token}/evidence", response_model=EvidenceFileResponse)
async def upload_evidence_by_invite(
    invite_token: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload evidence for Party B directly from the invitation portal.
    """
    dispute = db.query(Dispute).filter(Dispute.invite_token == invite_token).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Invalid invitation link")

    file_bytes = await file.read()
    orig_name = file.filename or "evidence_file"
    ext = os.path.splitext(orig_name)[1].lower()
    unique_filename = f"{dispute.id}_B_{uuid.uuid4().hex[:8]}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    extracted_text = extract_text_from_file(saved_path, ext, file_bytes)

    evidence = EvidenceFile(
        dispute_id=dispute.id,
        party_role="B",
        original_filename=orig_name,
        file_path=saved_path,
        file_type=file.content_type or ext,
        extracted_text=extracted_text if extracted_text else None
    )
    db.add(evidence)
    dispute.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(evidence)
    return evidence

@router.post("", response_model=DisputeResponse)
def create_dispute(data: DisputeCreate, db: Session = Depends(get_db)):
    """
    Create a new dispute instance in pending state.
    """
    new_dispute = Dispute(
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        category=data.category.strip() if data.category else None,
        invite_token=generate_token(),
        status="pending"
    )
    db.add(new_dispute)
    db.commit()
    db.refresh(new_dispute)
    return new_dispute

@router.get("/{dispute_id}", response_model=DisputeResponse)
def get_dispute(dispute_id: str, db: Session = Depends(get_db)):
    """
    Get full dispute record including parties and uploaded evidence files.
    """
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return dispute

@router.post("/{dispute_id}/party-a", response_model=PartyResponse)
def submit_party_a(dispute_id: str, data: PartyCreate, db: Session = Depends(get_db)):
    """
    Submit or update statement for Party A (Claimant).
    """
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    party_a = db.query(Party).filter(Party.dispute_id == dispute_id, Party.role == "A").first()
    if party_a:
        party_a.name = data.name.strip()
        party_a.statement = data.statement.strip()
        if data.email:
            party_a.email = data.email.strip()
    else:
        party_a = Party(
            dispute_id=dispute_id,
            role="A",
            name=data.name.strip(),
            email=data.email.strip() if data.email else None,
            statement=data.statement.strip()
        )
        db.add(party_a)

    party_b = db.query(Party).filter(Party.dispute_id == dispute_id, Party.role == "B").first()
    if party_b and party_b.statement:
        dispute.status = "submitted"
    dispute.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(party_a)
    return party_a

@router.post("/{dispute_id}/party-b", response_model=PartyResponse)
def submit_party_b(dispute_id: str, data: PartyCreate, db: Session = Depends(get_db)):
    """
    Submit or update statement for Party B (Respondent).
    """
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    party_b = db.query(Party).filter(Party.dispute_id == dispute_id, Party.role == "B").first()
    if party_b:
        party_b.name = data.name.strip()
        party_b.statement = data.statement.strip()
        if data.email:
            party_b.email = data.email.strip()
        party_b.responded_at = datetime.utcnow()
    else:
        party_b = Party(
            dispute_id=dispute_id,
            role="B",
            name=data.name.strip(),
            email=data.email.strip() if data.email else None,
            statement=data.statement.strip(),
            responded_at=datetime.utcnow()
        )
        db.add(party_b)

    party_a = db.query(Party).filter(Party.dispute_id == dispute_id, Party.role == "A").first()
    if party_a and party_a.statement:
        dispute.status = "submitted"
    dispute.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(party_b)
    return party_b

@router.post("/{dispute_id}/evidence", response_model=EvidenceFileResponse)
async def upload_evidence(
    dispute_id: str,
    party_role: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and extract text from supporting dispute evidence (PDF, TXT, images).
    """
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    file_bytes = await file.read()
    orig_name = file.filename or "evidence_file"
    ext = os.path.splitext(orig_name)[1].lower()
    unique_filename = f"{dispute_id}_{party_role}_{uuid.uuid4().hex[:8]}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    extracted_text = extract_text_from_file(saved_path, ext, file_bytes)

    evidence = EvidenceFile(
        dispute_id=dispute_id,
        party_role=party_role.upper(),
        original_filename=orig_name,
        file_path=saved_path,
        file_type=file.content_type or ext,
        extracted_text=extracted_text if extracted_text else None
    )
    db.add(evidence)
    dispute.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(evidence)
    return evidence

@router.post("/{dispute_id}/analyze")
def trigger_analysis(dispute_id: str, db: Session = Depends(get_db)):
    """
    Execute the multi-stage NLP & recommendation pipeline for a dispute.
    """
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    party_a = db.query(Party).filter(Party.dispute_id == dispute_id, Party.role == "A").first()
    party_b = db.query(Party).filter(Party.dispute_id == dispute_id, Party.role == "B").first()

    if not party_a or not party_b or not party_a.statement or not party_b.statement:
        raise HTTPException(status_code=400, detail="Both Party A and Party B statements are required before triggering AI analysis.")

    dispute.status = "analyzing"
    db.commit()

    evidence_items = db.query(EvidenceFile).filter(EvidenceFile.dispute_id == dispute_id).all()
    evidence_texts = [ev.extracted_text for ev in evidence_items if ev.extracted_text]

    results = run_dispute_pipeline(
        title=dispute.title,
        description=dispute.description or "",
        name_a=party_a.name,
        statement_a=party_a.statement,
        name_b=party_b.name,
        statement_b=party_b.statement,
        evidence_texts=evidence_texts
    )

    existing_analysis = db.query(AnalysisResult).filter(AnalysisResult.dispute_id == dispute_id).first()
    if existing_analysis:
        existing_analysis.dispute_category = results["dispute_category"]
        existing_analysis.classifier_confidence = results["classifier_confidence"]
        existing_analysis.entities_a = results["entities_a"]
        existing_analysis.entities_b = results["entities_b"]
        existing_analysis.similarity_score = results["similarity_score"]
        existing_analysis.nli_result = results["nli_result"]
        existing_analysis.similar_cases = results["similar_cases"]
        existing_analysis.recommendation = results["recommendation"]
        existing_analysis.explanation = results["explanation"]
        existing_analysis.created_at = datetime.utcnow()
        analysis_record = existing_analysis
    else:
        analysis_record = AnalysisResult(
            dispute_id=dispute_id,
            dispute_category=results["dispute_category"],
            classifier_confidence=results["classifier_confidence"],
            entities_a=results["entities_a"],
            entities_b=results["entities_b"],
            similarity_score=results["similarity_score"],
            nli_result=results["nli_result"],
            similar_cases=results["similar_cases"],
            recommendation=results["recommendation"],
            explanation=results["explanation"]
        )
        db.add(analysis_record)

    dispute.status = "complete"
    dispute.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(analysis_record)

    relay_broadcast("DECISION_ISSUED", {
        "id": dispute_id,
        "title": dispute.title,
        "status": dispute.status,
        "message": f"AI evaluation completed for '{dispute.title}'"
    })

    return {"message": "AI analysis completed successfully", "analysis": analysis_record}

@router.get("/{dispute_id}/analysis")
def get_dispute_analysis(dispute_id: str, db: Session = Depends(get_db)):
    """
    Retrieve AI pipeline analysis results for a dispute.
    """
    analysis = db.query(AnalysisResult).filter(AnalysisResult.dispute_id == dispute_id).first()
    return {"analysis": analysis}

@router.post("/{dispute_id}/respond")
def respond_to_recommendation(dispute_id: str, req: RespondRequest, db: Session = Depends(get_db)):
    """
    Record Party A or Party B acceptance or rejection of the proposed settlement.
    """
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    analysis = db.query(AnalysisResult).filter(AnalysisResult.dispute_id == dispute_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis results not found for this dispute")

    party_role = req.party.upper()
    response_val = req.response.lower()

    if party_role == "A":
        analysis.party_a_response = response_val
    elif party_role == "B":
        analysis.party_b_response = response_val
    else:
        raise HTTPException(status_code=400, detail="Party must be 'A' or 'B'")

    if analysis.party_a_response == "accept" and analysis.party_b_response == "accept":
        dispute.status = "settled"

    dispute.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(analysis)

    relay_broadcast("CASE_UPDATED", {
        "id": dispute_id,
        "title": dispute.title,
        "status": dispute.status,
        "message": f"Party {party_role} responded with '{response_val}'. Status: {dispute.status}"
    })

    return {"status": "success", "analysis": analysis, "dispute_status": dispute.status}
