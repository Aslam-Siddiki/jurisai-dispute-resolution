const mongoose = require('mongoose');

// Formal State Machine Statuses
const CASE_STATUSES = [
  'draft',
  'invited',
  'accepted',
  'declined',
  'expired',
  'submissions_open',
  'submissions_closed',
  'ai_evaluation',
  'decision_issued',
  'settled_accepted',
  'appealed_mediator',
  'solved'
];

const caseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  disputeType: {
    type: String,
    required: true,
    enum: [
      'Tenancy & Security Deposit',
      'Breach of Contract & Freelance',
      'Employment & Unpaid Wages',
      'Consumer Goods & E-Commerce',
      'Business Partnership Dispute',
      'Property Damage & Repairs',
      'Personal Loan & Debt Settlement',
      'General Civil Claim'
    ],
    default: 'General Civil Claim'
  },
  claimAmount: {
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  claimant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimantName: {
    type: String,
    required: true
  },
  claimantEmail: {
    type: String,
    required: true
  },
  respondentName: {
    type: String,
    required: true,
    trim: true
  },
  respondentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: CASE_STATUSES,
    default: 'draft'
  },
  statusHistory: [{
    fromStatus: String,
    toStatus: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  deadlines: {
    inviteExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
    },
    submissionsDeadline: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days default
    }
  },
  activeInvitation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invitation'
  },
  activeDecision: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Decision'
  }
}, {
  timestamps: true
});

caseSchema.index({ status: 1 });
caseSchema.index({ claimant: 1 });
caseSchema.index({ respondent: 1 });
caseSchema.index({ respondentEmail: 1 });

module.exports = {
  Case: mongoose.model('Case', caseSchema),
  CASE_STATUSES
};
