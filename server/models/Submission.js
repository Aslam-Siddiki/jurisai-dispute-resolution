const mongoose = require('mongoose');

const evidenceFileSchema = new mongoose.Schema({
  originalFilename: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  sizeBytes: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  extractedText: {
    type: String,
    default: ''
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const submissionSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  party: {
    type: String,
    enum: ['claimant', 'respondent'],
    required: true
  },
  partyName: {
    type: String,
    required: true
  },
  partyEmail: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  statementText: {
    type: String,
    required: true
  },
  evidenceFiles: [evidenceFileSchema],
  status: {
    type: String,
    enum: ['draft', 'submitted'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

submissionSchema.index({ caseId: 1, party: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
