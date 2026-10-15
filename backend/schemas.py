from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class DisputeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None

class DisputeRegisterRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    party_a_name: str
    party_a_email: Optional[str] = None
    party_a_statement: str
    party_b_name: str
    party_b_email: Optional[str] = None
    send_email: bool = True

class PartyCreate(BaseModel):
    name: str
    statement: str
    email: Optional[str] = None

class PartyResponse(BaseModel):
    id: str
    dispute_id: str
    role: str
    name: str
    email: Optional[str] = None
    statement: Optional[str] = None
    invited_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EvidenceFileResponse(BaseModel):
    id: str
    dispute_id: str
    party_role: str
    original_filename: str
    file_path: str
    file_type: Optional[str] = None
    extracted_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DisputeResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    invite_token: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    parties: List[PartyResponse] = []
    evidence_files: List[EvidenceFileResponse] = []

    class Config:
        from_attributes = True

class DisputeListItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    invite_token: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    party_a_name: Optional[str] = None
    party_b_name: Optional[str] = None

    class Config:
        from_attributes = True

class PartyBRespondRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    statement: str

class SendInviteRequest(BaseModel):
    party_b_email: Optional[str] = None
    party_b_name: Optional[str] = None

class InviteInfoResponse(BaseModel):
    dispute_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: str
    created_at: datetime
    invite_token: str
    party_a: Optional[PartyResponse] = None
    party_b: Optional[PartyResponse] = None
    has_responded: bool = False
    evidence_files: List[EvidenceFileResponse] = []

class RespondRequest(BaseModel):
    party: str  # 'A' or 'B'
    response: str  # 'accept' or 'reject'

class AnalysisResultResponse(BaseModel):
    id: str
    dispute_id: str
    dispute_category: Optional[str] = None
    classifier_confidence: Optional[float] = None
    entities_a: Optional[Dict[str, Any]] = None
    entities_b: Optional[Dict[str, Any]] = None
    similarity_score: Optional[float] = None
    nli_result: Optional[Dict[str, Any]] = None
    similar_cases: Optional[List[Dict[str, Any]]] = None
    recommendation: Optional[str] = None
    explanation: Optional[str] = None
    party_a_response: Optional[str] = None
    party_b_response: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReferenceCase(BaseModel):
    id: int
    title: str
    category: str
    fact_summary: str
    resolution: str
