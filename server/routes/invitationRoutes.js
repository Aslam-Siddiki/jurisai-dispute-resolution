const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const { Case } = require('../models/Case');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { optionalAuth } = require('../middleware/auth');
const { transitionCase } = require('../services/stateMachine');
const upload = require('../middleware/upload');
const { broadcast } = require('../services/realtime');

// GET /api/invitations/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token }).populate('caseId');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation link is invalid or does not exist.' });
    }

    if (invitation.isExpired()) {
      if (invitation.status === 'pending') {
        invitation.status = 'expired';
        await invitation.save();
        if (invitation.caseId && invitation.caseId.status === 'invited') {
          await transitionCase(invitation.caseId, 'expired', null, 'Invitation expired automatically after 7 days.');
        }
      }
      return res.status(410).json({
        message: 'This invitation has expired.',
        invitation,
        expired: true
      });
    }

    // Fetch claimant submission if available
    const claimantSubmission = await Submission.findOne({
      caseId: invitation.caseId._id,
      party: 'claimant'
    });

    res.json({
      invitation,
      case: invitation.caseId,
      claimantSubmission,
      hasAccepted: invitation.status === 'accepted',
      hasDeclined: invitation.status === 'declined'
    });
  } catch (err) {
    console.error('Verify invitation error:', err);
    res.status(500).json({ message: 'Failed to verify invitation.' });
  }
});

// POST /api/invitations/accept/:token
router.post('/accept/:token', optionalAuth, async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token }).populate('caseId');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found.' });
    }

    if (invitation.isExpired()) {
      return res.status(410).json({ message: 'Invitation link has expired.' });
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    const caseDoc = invitation.caseId;
    if (req.user) {
      caseDoc.respondent = req.user._id;
    }

    // Transition State Machine: invited -> accepted -> submissions_open
    if (caseDoc.status === 'invited') {
      await transitionCase(caseDoc, 'accepted', req.user?._id, 'Respondent accepted the mediation invitation.');
      await transitionCase(caseDoc, 'submissions_open', req.user?._id, 'Case opened for bilateral evidence submissions.');
    }

    broadcast('CASE_UPDATED', {
      case: caseDoc,
      invitation,
      message: `Respondent accepted invitation for case "${caseDoc.title}".`
    });

    res.json({
      message: 'Invitation accepted. Submissions are now open for this dispute.',
      case: caseDoc,
      invitation
    });
  } catch (err) {
    console.error('Accept invitation error:', err);
    res.status(500).json({ message: err.message || 'Failed to accept invitation.' });
  }
});

// POST /api/invitations/decline/:token
router.post('/decline/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { reason } = req.body;

    const invitation = await Invitation.findOne({ token }).populate('caseId');
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found.' });
    }

    invitation.status = 'declined';
    invitation.declinedAt = new Date();
    invitation.declineReason = reason || '';
    await invitation.save();

    const caseDoc = invitation.caseId;
    if (caseDoc.status === 'invited') {
      await transitionCase(caseDoc, 'declined', null, `Respondent declined invitation: ${reason || 'No reason provided'}`);
    }

    broadcast('CASE_UPDATED', {
      case: caseDoc,
      invitation,
      message: `Respondent declined invitation for case "${caseDoc.title}".`
    });

    res.json({
      message: 'Invitation declined.',
      case: caseDoc,
      invitation
    });
  } catch (err) {
    console.error('Decline invitation error:', err);
    res.status(500).json({ message: 'Failed to decline invitation.' });
  }
});

// POST /api/invitations/:token/submit-response
// Allows respondent to accept and submit defense statement + evidence in one seamless flow
router.post('/:token/submit-response', optionalAuth, upload.array('evidenceFiles', 5), async (req, res) => {
  try {
    const { token } = req.params;
    const { statementText, respondentName, respondentEmail } = req.body;

    if (!statementText || !statementText.trim()) {
      return res.status(400).json({ message: 'Statement text is required.' });
    }

    const invitation = await Invitation.findOne({ token }).populate('caseId');
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found.' });
    }

    const caseDoc = invitation.caseId;

    // Accept invitation if still pending
    if (invitation.status === 'pending') {
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
      await invitation.save();

      if (caseDoc.status === 'invited') {
        await transitionCase(caseDoc, 'accepted', req.user?._id, 'Respondent accepted invitation.');
        await transitionCase(caseDoc, 'submissions_open', req.user?._id, 'Opened for submissions.');
      }
    }

    // Process uploaded evidence files
    const evidenceFiles = (req.files || []).map(file => ({
      originalFilename: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileType: file.mimetype,
      sizeBytes: file.size,
      description: 'Respondent submitted exhibit'
    }));

    // Create or update respondent submission
    let submission = await Submission.findOne({
      caseId: caseDoc._id,
      party: 'respondent'
    });

    const partyName = respondentName?.trim() || invitation.recipientName;
    const partyEmail = respondentEmail?.trim() || invitation.recipientEmail;

    if (submission) {
      submission.statementText = statementText.trim();
      submission.partyName = partyName;
      submission.partyEmail = partyEmail;
      submission.evidenceFiles.push(...evidenceFiles);
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      submission = new Submission({
        caseId: caseDoc._id,
        party: 'respondent',
        partyName,
        partyEmail,
        userId: req.user?._id || null,
        statementText: statementText.trim(),
        evidenceFiles,
        status: 'submitted'
      });
      await submission.save();
    }

    // Check if claimant has also submitted
    const claimantSub = await Submission.findOne({
      caseId: caseDoc._id,
      party: 'claimant',
      status: 'submitted'
    });

    // If both parties submitted, move to submissions_closed
    if (claimantSub && caseDoc.status === 'submissions_open') {
      await transitionCase(
        caseDoc,
        'submissions_closed',
        req.user?._id,
        'Both Claimant and Respondent submissions registered. Ready for AI evaluation.'
      );
    }

    broadcast('CASE_UPDATED', {
      case: caseDoc,
      submission,
      message: `Respondent submitted defense for case "${caseDoc.title}". Status: ${caseDoc.status}`
    });

    res.json({
      message: 'Respondent statement and evidence submitted successfully.',
      submission,
      case: caseDoc
    });
  } catch (err) {
    console.error('Submit response error:', err);
    res.status(500).json({ message: err.message || 'Failed to submit response.' });
  }
});

module.exports = router;
