const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => crypto.randomBytes(24).toString('hex')
  },
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  recipientName: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiration
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  declinedAt: {
    type: Date,
    default: null
  },
  declineReason: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

invitationSchema.methods.isExpired = function () {
  return Date.now() > this.expiresAt.getTime();
};

module.exports = mongoose.model('Invitation', invitationSchema);
