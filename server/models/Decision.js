const mongoose = require('mongoose');

const decisionSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    unique: true,
    index: true
  },
  disputeCategory: {
    type: String,
    default: 'General Civil Claim'
  },
  // 1. Structured Findings
  findings: [{
    category: String,
    statement: String,
    corroboration: String
  }],
  // Points agreed by both parties
  agreements: [{
    type: String
  }],
  // Disputed points / Contradictions detected
  disputedPoints: [{
    claimA: String,
    claimB: String,
    issue: String
  }],
  // 2. Extracted Entities
  extractedEntities: {
    claimant: {
      money: [String],
      dates: [String],
      deadlines: [String]
    },
    respondent: {
      money: [String],
      dates: [String],
      deadlines: [String]
    }
  },
  // 3. Applied Law / Precedents (RAG)
  legalProvisions: [{
    statuteOrPrecedent: String,
    relevance: String,
    similarityScore: Number,
    pastOutcome: String
  }],
  // 4. Detailed AI Reasoning & Synthesis
  reasoning: {
    type: String,
    required: true
  },
  // 5. Recommended Concrete Compromise Outcome
  outcome: {
    type: String,
    required: true
  },
  recommendedAllocation: {
    claimantSharePercent: Number,
    respondentSharePercent: Number,
    recommendedPayout: Number
  },
  // 6. Confidence & Model Quality
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  // 7. Human Escalation Trigger
  needsHumanEscalation: {
    type: Boolean,
    default: false
  },
  escalationReason: {
    type: String,
    default: ''
  },
  modelVersion: {
    type: String,
    default: 'JurisAI-NLP-v2.1'
  },
  // 8. Party Responses (Accept / Appeal)
  claimantDecision: {
    type: String,
    enum: ['pending', 'accepted', 'appealed'],
    default: 'pending'
  },
  claimantRespondedAt: Date,
  respondentDecision: {
    type: String,
    enum: ['pending', 'accepted', 'appealed'],
    default: 'pending'
  },
  respondentRespondedAt: Date,
  appealDetails: {
    appealedBy: String,
    reason: String,
    submittedAt: Date,
    mediatorNotes: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Decision', decisionSchema);
