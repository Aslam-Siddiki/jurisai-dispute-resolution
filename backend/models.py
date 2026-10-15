import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

def generate_token():
    return uuid.uuid4().hex[:16]

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(255), nullable=True)
    invite_token = Column(String(64), unique=True, default=generate_token, index=True)
    status = Column(String(50), nullable=False, default="pending")  # pending, submitted, analyzing, complete, settled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    parties = relationship("Party", back_populates="dispute", cascade="all, delete-orphan")
    evidence_files = relationship("EvidenceFile", back_populates="dispute", cascade="all, delete-orphan")
    analysis_result = relationship("AnalysisResult", back_populates="dispute", uselist=False, cascade="all, delete-orphan")

class Party(Base):
    __tablename__ = "parties"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dispute_id = Column(String(36), ForeignKey("disputes.id"), nullable=False)
    role = Column(String(1), nullable=False)  # 'A' or 'B'
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    statement = Column(Text, nullable=True)
    invited_at = Column(DateTime, nullable=True)
    responded_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dispute = relationship("Dispute", back_populates="parties")

class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dispute_id = Column(String(36), ForeignKey("disputes.id"), nullable=False)
    party_role = Column(String(1), nullable=False)  # 'A' or 'B'
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_type = Column(String(50), nullable=True)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dispute = relationship("Dispute", back_populates="evidence_files")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dispute_id = Column(String(36), ForeignKey("disputes.id"), unique=True, nullable=False)
    dispute_category = Column(String(255), nullable=True)
    classifier_confidence = Column(Float, nullable=True)
    entities_a = Column(JSON, nullable=True)
    entities_b = Column(JSON, nullable=True)
    similarity_score = Column(Float, nullable=True)
    nli_result = Column(JSON, nullable=True)
    similar_cases = Column(JSON, nullable=True)
    recommendation = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    party_a_response = Column(String(50), nullable=True)
    party_b_response = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dispute = relationship("Dispute", back_populates="analysis_result")
