const express = require('express');
const router = express.Router();
const { Case, CASE_STATUSES } = require('../models/Case');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Submission = require('../models/Submission');
const Decision = require('../models/Decision');
const { optionalAuth, requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { transitionCase } = require('../services/stateMachine');
const { sendInvitationEmail } = require('../services/emailService');
const { evaluateCaseWithAI } = require('../services/aiBridgeService');
const { broadcast } = require('../services/realtime');

// GET /api/cases - List all cases
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && CASE_STATUSES.includes(status)) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { disputeType: { $regex: search, $options: 'i' } },
        { claimantName: { $regex: search, $options: 'i' } },
        { respondentName: { $regex: search, $options: 'i' } }
      ];
    }

    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .populate('activeInvitation', 'token status expiresAt')
      .lean();

    res.json(cases);
  } catch (err) {
    console.error('List cases error:', err);
    res.status(500).json({ message: 'Failed to retrieve cases.' });
  }
});

// POST /api/cases - Register new case, claimant statement, and invite respondent
router.post('/', optionalAuth, upload.array('evidenceFiles', 5), async (req, res) => {
  try {
    const {
      title,
      disputeType = 'General Civil Claim',
      claimAmount = 0,
      description = '',
      claimantName,
      claimantEmail,
      claimantStatement,
      respondentName,
      respondentEmail,
      sendEmail = true
    } = req.body;

    if (!title || !claimantName || !claimantStatement || !respondentName || !respondentEmail) {
      return res.status(400).json({
        message: 'Dispute title, claimant name & statement, and respondent name & email are required.'
      });
    }

    // Administrators are neutral platform overseers and cannot file disputes
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: 'Administrators are neutral platform overseers and cannot file disputes.'
      });
    }

    // 1. Resolve or create Claimant User
    let claimantUser = req.user;
    if (!claimantUser) {
      const email = (claimantEmail || `claimant.${Date.now()}@jurisai.test`).toLowerCase();
      claimantUser = await User.findOne({ email });
      if (!claimantUser) {
        claimantUser = new User({
          name: claimantName.trim(),
          email,
          password: 'guest_claimant_pwd_2026',
          role: 'claimant'
        });
        await claimantUser.save();
      }
    }

    // Resolve Respondent User if already registered
    const respEmailClean = respondentEmail.toLowerCase().trim();
    const respondentUser = await User.findOne({ email: respEmailClean });

    // 2. Create Case document in 'draft'
    const newCase = new Case({
      title: title.trim(),
      disputeType,
      claimAmount: {
        amount: Number(claimAmount) || 0,
        currency: 'USD'
      },
      description: description.trim(),
      claimant: claimantUser._id,
      claimantName: claimantName.trim(),
      claimantEmail: claimantUser.email,
      respondent: respondentUser ? respondentUser._id : null,
      respondentName: respondentName.trim(),
      respondentEmail: respEmailClean,
      status: 'draft',
      statusHistory: [{
        fromStatus: 'none',
        toStatus: 'draft',
        changedBy: claimantUser._id,
        reason: 'Case created by claimant'
      }]
    });
    await newCase.save();

    // 3. Process uploaded evidence files
    const evidenceFiles = (req.files || []).map(file => ({
      originalFilename: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileType: file.mimetype,
      sizeBytes: file.size,
      description: 'Claimant initial exhibit'
    }));

    // 4. Save Claimant Submission
    const claimantSubmission = new Submission({
      caseId: newCase._id,
      party: 'claimant',
      partyName: claimantName.trim(),
      partyEmail: claimantUser.email,
      userId: claimantUser._id,
      statementText: claimantStatement.trim(),
      evidenceFiles,
      status: 'submitted'
    });
    await claimantSubmission.save();

    // 5. Create Invitation for Respondent
    const invitation = new Invitation({
      caseId: newCase._id,
      recipientName: respondentName.trim(),
      recipientEmail: respondentEmail.toLowerCase().trim()
    });
    await invitation.save();

    newCase.activeInvitation = invitation._id;

    // Transition State Machine: draft -> invited
    await transitionCase(
      newCase,
      'invited',
      claimantUser._id,
      `Invitation dispatched to ${respondentName} (${respondentEmail})`
    );

    // 6. Send / Prepare Email
    let emailStatus = null;
    if (sendEmail === 'true' || sendEmail === true) {
      emailStatus = await sendInvitationEmail(newCase, invitation);
    }

    // 7. Broadcast real-time event to all connected dashboards
    broadcast('CASE_CREATED', {
      case: newCase,
      message: `New dispute registered: "${newCase.title}"`
    });

    res.status(201).json({
      message: 'Case successfully registered and invitation dispatched.',
      case: newCase,
      invitationToken: invitation.token,
      inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${invitation.token}`,
      emailStatus
    });
  } catch (err) {
    console.error('Create case error:', err);
    res.status(500).json({ message: err.message || 'Failed to create case.' });
  }
});

// GET /api/cases/mine - Authenticated: return only this user's cases (as claimant or respondent)
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userEmail = req.user.email?.toLowerCase().trim();
    const userName = req.user.name?.toLowerCase().trim();
    const userRole = req.user.role;

    let query;
    if (userRole === 'admin') {
      // Admins see all cases
      query = {};
    } else {
      query = {
        $or: [
          { claimant: req.user._id },
          { respondent: req.user._id },
          ...(userEmail ? [
            { claimantEmail: new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            { respondentEmail: new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          ] : []),
          ...(userName ? [
            { claimantName: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            { respondentName: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          ] : [])
        ]
      };
    }

    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .populate('activeInvitation', 'token status expiresAt')
      .lean();

    res.json(cases);
  } catch (err) {
    console.error('List my cases error:', err);
    res.status(500).json({ message: 'Failed to retrieve your cases.' });
  }
});

// GET /api/cases/:id - Case details with submissions, invitation, decision
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('activeInvitation')
      .populate('activeDecision');

    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    const claimantSubmission = await Submission.findOne({ caseId: caseDoc._id, party: 'claimant' });
    const respondentSubmission = await Submission.findOne({ caseId: caseDoc._id, party: 'respondent' });
    const decision = await Decision.findOne({ caseId: caseDoc._id });

    res.json({
      case: caseDoc,
      claimantSubmission,
      respondentSubmission,
      decision,
      invitation: caseDoc.activeInvitation
    });
  } catch (err) {
    console.error('Get case error:', err);
    res.status(500).json({ message: 'Failed to fetch case details.' });
  }
});

// POST /api/cases/:id/evaluate - Run multi-stage AI evaluation pipeline
router.post('/:id/evaluate', optionalAuth, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    const claimantSub = await Submission.findOne({ caseId: caseDoc._id, party: 'claimant' });
    const respondentSub = await Submission.findOne({ caseId: caseDoc._id, party: 'respondent' });

    if (!claimantSub || !respondentSub || !claimantSub.statementText || !respondentSub.statementText) {
      return res.status(400).json({
        message: 'Both Claimant and Respondent statements are required before AI evaluation.'
      });
    }

    // Transition State Machine: -> ai_evaluation
    if (caseDoc.status === 'submissions_closed' || caseDoc.status === 'submissions_open') {
      await transitionCase(caseDoc, 'ai_evaluation', req.user?._id, 'Commencing multi-stage AI evaluation pipeline.');
    }

    // Execute AI Evaluation via Python Service or structured fallback
    const aiResult = await evaluateCaseWithAI(caseDoc, claimantSub, respondentSub);

    // Save or update Decision document
    let decision = await Decision.findOne({ caseId: caseDoc._id });
    if (decision) {
      Object.assign(decision, {
        disputeCategory: aiResult.dispute_category || caseDoc.disputeType,
        findings: aiResult.findings || [],
        agreements: aiResult.agreements || [],
        disputedPoints: aiResult.disputedPoints || [],
        extractedEntities: aiResult.extractedEntities || {},
        legalProvisions: aiResult.legalProvisions || [],
        reasoning: aiResult.reasoning || '',
        outcome: aiResult.outcome || '',
        confidence: aiResult.confidence || 0.8,
        needsHumanEscalation: !!aiResult.needsHumanEscalation,
        escalationReason: aiResult.escalationReason || '',
        modelVersion: aiResult.modelVersion || 'JurisAI-NLP-v2.1'
      });
      await decision.save();
    } else {
      decision = new Decision({
        caseId: caseDoc._id,
        disputeCategory: aiResult.dispute_category || caseDoc.disputeType,
        findings: aiResult.findings || [],
        agreements: aiResult.agreements || [],
        disputedPoints: aiResult.disputedPoints || [],
        extractedEntities: aiResult.extractedEntities || {},
        legalProvisions: aiResult.legalProvisions || [],
        reasoning: aiResult.reasoning || '',
        outcome: aiResult.outcome || '',
        confidence: aiResult.confidence || 0.8,
        needsHumanEscalation: !!aiResult.needsHumanEscalation,
        escalationReason: aiResult.escalationReason || '',
        modelVersion: aiResult.modelVersion || 'JurisAI-NLP-v2.1'
      });
      await decision.save();
    }

    caseDoc.activeDecision = decision._id;

    // Transition State Machine: ai_evaluation -> decision_issued
    await transitionCase(caseDoc, 'decision_issued', req.user?._id, 'AI Decision synthesized and issued to parties.');

    broadcast('DECISION_ISSUED', {
      case: caseDoc,
      decision,
      message: `AI Decision synthesized for "${caseDoc.title}"`
    });

    res.json({
      message: 'AI evaluation completed successfully.',
      case: caseDoc,
      decision
    });
  } catch (err) {
    console.error('Evaluate case error:', err);
    res.status(500).json({ message: err.message || 'AI evaluation failed.' });
  }
});

// POST /api/cases/:id/decision/respond - Accept or Appeal Decision
router.post('/:id/decision/respond', optionalAuth, async (req, res) => {
  try {
    const { party, action, reason } = req.body; // party: 'claimant' | 'respondent', action: 'accept' | 'appeal'

    if (!['claimant', 'respondent'].includes(party) || !['accept', 'appeal'].includes(action)) {
      return res.status(400).json({ message: 'Invalid party or action. Must be claimant/respondent and accept/appeal.' });
    }

    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    // Role verification: ensure user only acts on their own behalf
    if (req.user) {
      const userEmail = req.user.email?.toLowerCase().trim();
      const userName = req.user.name?.toLowerCase().trim();
      const isClaimantMatch = (caseDoc.claimantEmail && caseDoc.claimantEmail.toLowerCase() === userEmail) ||
                              (caseDoc.claimantName && caseDoc.claimantName.toLowerCase() === userName) ||
                              (caseDoc.claimant && caseDoc.claimant.toString() === req.user._id.toString());
      const isRespondentMatch = (caseDoc.respondentEmail && caseDoc.respondentEmail.toLowerCase() === userEmail) ||
                                (caseDoc.respondentName && caseDoc.respondentName.toLowerCase() === userName) ||
                                (caseDoc.respondent && caseDoc.respondent.toString() === req.user._id.toString());

      if (party === 'claimant' && !isClaimantMatch && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized. You cannot accept or reject this settlement on behalf of the Claimant.' });
      }
      if (party === 'respondent' && !isRespondentMatch && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized. You cannot accept or reject this settlement on behalf of the Respondent.' });
      }
    }

    const decision = await Decision.findOne({ caseId: caseDoc._id });
    if (!decision) {
      return res.status(404).json({ message: 'No decision issued for this case yet.' });
    }

    const responseStatus = action === 'accept' ? 'accepted' : 'appealed';

    if (party === 'claimant') {
      decision.claimantDecision = responseStatus;
      decision.claimantRespondedAt = new Date();
    } else {
      decision.respondentDecision = responseStatus;
      decision.respondentRespondedAt = new Date();
    }

    if (action === 'appeal') {
      decision.appealDetails = {
        appealedBy: party,
        reason: reason || 'Party requested human mediator appeal review.',
        submittedAt: new Date()
      };
      // State transition: decision_issued -> appealed_mediator
      await transitionCase(
        caseDoc,
        'appealed_mediator',
        req.user?._id,
        `${party.toUpperCase()} appealed AI decision: ${reason || 'Human review requested'}`
      );
    } else if (decision.claimantDecision === 'accepted' && decision.respondentDecision === 'accepted') {
      // Both accepted! State transition: decision_issued -> settled_accepted
      await transitionCase(
        caseDoc,
        'settled_accepted',
        req.user?._id,
        'Both Claimant and Respondent formally accepted the settlement agreement.'
      );
    }

    await decision.save();

    broadcast('CASE_UPDATED', {
      case: caseDoc,
      decision,
      message: `Party ${party} performed '${action}' on case "${caseDoc.title}". Status: ${caseDoc.status}`
    });

    res.json({
      message: `Decision response recorded (${action}).`,
      case: caseDoc,
      decision
    });
  } catch (err) {
    console.error('Decision response error:', err);
    res.status(500).json({ message: err.message || 'Failed to record response.' });
  }
});

// POST /api/cases/:id/reinvite - Re-send invitation to respondent
router.post('/:id/reinvite', optionalAuth, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    let invitation = await Invitation.findOne({ caseId: caseDoc._id });
    if (!invitation) {
      invitation = new Invitation({
        caseId: caseDoc._id,
        recipientName: caseDoc.respondentName,
        recipientEmail: caseDoc.respondentEmail
      });
      await invitation.save();
    } else {
      invitation.status = 'pending';
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await invitation.save();
    }

    caseDoc.activeInvitation = invitation._id;
    if (['draft', 'expired', 'declined'].includes(caseDoc.status)) {
      await transitionCase(caseDoc, 'invited', req.user?._id, 'Invitation re-issued to respondent.');
    }

    const emailStatus = await sendInvitationEmail(caseDoc, invitation);

    res.json({
      message: 'Invitation re-sent successfully.',
      invitation,
      inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${invitation.token}`,
      emailStatus
    });
  } catch (err) {
    console.error('Re-invite error:', err);
    res.status(500).json({ message: 'Failed to re-issue invitation.' });
  }
});

// DELETE /api/cases/:id — Admin only: permanently remove a case and all related docs
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ message: 'Case not found.' });

    await Promise.all([
      Submission.deleteMany({ caseId: caseDoc._id }),
      Invitation.deleteMany({ caseId: caseDoc._id }),
      Decision.deleteMany({ caseId: caseDoc._id }),
      caseDoc.deleteOne()
    ]);

    broadcast('CASE_DELETED', {
      caseId: req.params.id,
      title: caseDoc.title,
      message: `Case "${caseDoc.title}" was permanently deleted by Administrator.`
    });

    res.json({ message: `Case "${caseDoc.title}" and all related records permanently deleted.` });
  } catch (err) {
    console.error('Delete case error:', err);
    res.status(500).json({ message: 'Failed to delete case.' });
  }
});

// PATCH /api/cases/:id/solve — Authenticated user (Claimant or Admin) marks case as solved
router.patch('/:id/solve', requireAuth, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ message: 'Case not found.' });

    const isOwner = caseDoc.claimantEmail?.toLowerCase() === req.user.email?.toLowerCase() ||
                    caseDoc.claimant?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the case claimant or an administrator can mark it as solved.' });
    }

    const prevStatus = caseDoc.status;
    caseDoc.status = 'solved';
    caseDoc.statusHistory.push({
      fromStatus: prevStatus,
      toStatus: 'solved',
      changedBy: req.user._id,
      timestamp: new Date(),
      reason: `Case marked as solved by ${isAdmin ? 'Administrator' : 'Claimant'}`
    });
    await caseDoc.save();

    broadcast('CASE_SOLVED', {
      case: caseDoc,
      message: `Case "${caseDoc.title}" marked as solved by ${isAdmin ? 'Administrator' : 'Claimant'}.`
    });

    res.json({ message: 'Case marked as solved.', case: caseDoc });
  } catch (err) {
    console.error('Solve case error:', err);
    res.status(500).json({ message: 'Failed to mark case as solved.' });
  }
});

// Compatibility aliases
router.post('/register', (req, res, next) => {
  // Delegate to POST / handler
  req.url = '/';
  router.handle(req, res, next);
});

router.post('/:id/analyze', (req, res, next) => {
  req.url = `/${req.params.id}/evaluate`;
  router.handle(req, res, next);
});

router.get('/invite/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token }).populate('caseId');
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found.' });
    }
    const claimantSub = await Submission.findOne({ caseId: invitation.caseId._id, party: 'claimant' });
    const respondentSub = await Submission.findOne({ caseId: invitation.caseId._id, party: 'respondent' });
    res.json({
      dispute_id: invitation.caseId._id,
      title: invitation.caseId.title,
      description: invitation.caseId.description,
      category: invitation.caseId.disputeType,
      status: invitation.caseId.status,
      created_at: invitation.caseId.createdAt,
      invite_token: invitation.token,
      party_a: {
        name: invitation.caseId.claimantName,
        email: invitation.caseId.claimantEmail,
        statement: claimantSub?.statementText || ''
      },
      party_b: {
        name: invitation.recipientName,
        email: invitation.recipientEmail,
        statement: respondentSub?.statementText || ''
      },
      has_responded: Boolean(respondentSub && respondentSub.statementText),
      evidence_files: (claimantSub?.evidenceFiles || []).map(f => ({
        original_filename: f.originalFilename,
        file_path: f.fileUrl,
        file_type: f.fileType
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching invitation info.' });
  }
});

module.exports = router;
