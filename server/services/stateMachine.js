// Formal Case Lifecycle State Machine
const VALID_TRANSITIONS = {
  draft: ['invited', 'declined'],
  invited: ['accepted', 'declined', 'expired'],
  accepted: ['submissions_open'],
  declined: ['draft'], // Can be reopened/edited
  expired: ['invited'], // Can be reinvited
  submissions_open: ['submissions_closed'],
  submissions_closed: ['ai_evaluation', 'submissions_open'],
  ai_evaluation: ['decision_issued', 'submissions_closed'],
  decision_issued: ['settled_accepted', 'appealed_mediator'],
  settled_accepted: [], // Final terminal state
  appealed_mediator: ['decision_issued'] // Can issue updated decision after human review
};

const STATUS_LABELS = {
  draft: 'Draft',
  invited: 'Respondent Invited',
  accepted: 'Invitation Accepted',
  declined: 'Invitation Declined',
  expired: 'Invitation Expired',
  submissions_open: 'Submissions Open',
  submissions_closed: 'Submissions Closed',
  ai_evaluation: 'AI Evaluation in Progress',
  decision_issued: 'Decision Issued',
  settled_accepted: 'Settlement Accepted',
  appealed_mediator: 'Appealed to Human Mediator'
};

function canTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

async function transitionCase(caseDoc, nextStatus, userId = null, reason = '') {
  if (!canTransition(caseDoc.status, nextStatus)) {
    throw new Error(
      `Invalid state transition: Cannot change case status from '${caseDoc.status}' to '${nextStatus}'.`
    );
  }

  const prevStatus = caseDoc.status;
  caseDoc.status = nextStatus;
  caseDoc.statusHistory.push({
    fromStatus: prevStatus,
    toStatus: nextStatus,
    changedBy: userId,
    timestamp: new Date(),
    reason: reason || `Automated transition to ${nextStatus}`
  });

  await caseDoc.save();
  return caseDoc;
}

module.exports = {
  VALID_TRANSITIONS,
  STATUS_LABELS,
  canTransition,
  transitionCase
};
