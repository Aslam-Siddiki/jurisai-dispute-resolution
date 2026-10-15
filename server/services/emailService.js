const nodemailer = require('nodemailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function buildInviteEmailHtml(caseDoc, invitation, inviteUrl) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>JurisAI Dispute Mediation Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060b18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #060b18; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #111d35; border-radius: 14px; border: 1px solid rgba(99, 179, 237, 0.2); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #1e3a8a 0%, #0d1626 100%); border-bottom: 1px solid rgba(99, 179, 237, 0.15);">
              <span style="font-size: 24px; font-weight: 800; color: #60a5fa; letter-spacing: -0.5px;">⚖️ JurisAI</span>
              <span style="font-size: 13px; color: #94a3b8; margin-left: 8px;">Civil ADR State Machine</span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 700;">
                Formal Invitation to Dispute Resolution
              </h2>
              <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                Hello <strong>${invitation.recipientName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                <strong>${caseDoc.claimantName}</strong> has initiated a civil dispute mediation case against you regarding:
              </p>

              <!-- Dispute Details Card -->
              <div style="background-color: #0d1626; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 18px 20px; margin: 0 0 24px 0;">
                <div style="font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 4px;">Case Title</div>
                <div style="font-size: 17px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">${caseDoc.title}</div>
                <div style="font-size: 13px; color: #a78bfa;">Category: ${caseDoc.disputeType} &bull; Claimed: $${caseDoc.claimAmount?.amount || 0} ${caseDoc.claimAmount?.currency || 'USD'}</div>
              </div>

              <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                You are invited to join the resolution workflow. Using our tokenized access, you can review the claimant's initial filing, formally accept the invitation, and submit your defense without needing to pre-register.
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                      Review Claim &amp; Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                This invitation link expires on <strong>${new Date(invitation.expiresAt).toLocaleDateString()}</strong>.<br>
                Direct link: <a href="${inviteUrl}" style="color: #60a5fa;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0d1626; border-top: 1px solid rgba(99, 179, 237, 0.1); text-align: center;">
              <p style="margin: 0; color: #475569; font-size: 12px;">
                JurisAI Educational Civil Mediation Platform &bull; Impartial Dispute Resolution
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendInvitationEmail(caseDoc, invitation) {
  const inviteUrl = `${FRONTEND_URL}/invite/${invitation.token}`;
  const subject = `Mediation Invitation: Claim regarding "${caseDoc.title}" from ${caseDoc.claimantName}`;

  const plainText = `Hello ${invitation.recipientName},

${caseDoc.claimantName} has initiated a civil dispute mediation case regarding: "${caseDoc.title}".
Category: ${caseDoc.disputeType}
Claim Amount: $${caseDoc.claimAmount?.amount || 0}

Please review the claim and accept the resolution invitation using the following link:
${inviteUrl}

This link expires on ${new Date(invitation.expiresAt).toLocaleDateString()}.

JurisAI Alternative Dispute Resolution Platform`;

  const html = buildInviteEmailHtml(caseDoc, invitation, inviteUrl);

  const mailtoParams = new URLSearchParams({
    subject,
    body: plainText
  }).toString();
  const mailtoLink = `mailto:${invitation.recipientEmail}?${mailtoParams}`;

  // If SMTP is configured, send actual email
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"JurisAI Mediation" <${process.env.SMTP_USER}>`,
        to: invitation.recipientEmail,
        subject,
        text: plainText,
        html
      });

      return {
        success: true,
        mode: 'smtp',
        recipient: invitation.recipientEmail,
        inviteUrl,
        mailtoLink,
        message: `Invitation email sent via SMTP to ${invitation.recipientEmail}`
      };
    } catch (err) {
      console.warn('[EMAIL SERVICE] SMTP failed:', err.message, 'Falling back to simulation.');
    }
  }

  // Development simulation mode
  console.log(`[EMAIL SERVICE] Simulated email sent to ${invitation.recipientEmail} | Invite: ${inviteUrl}`);
  return {
    success: true,
    mode: 'simulated',
    recipient: invitation.recipientEmail,
    subject,
    inviteUrl,
    mailtoLink,
    emailPreview: plainText,
    message: `Invitation link generated and simulated for ${invitation.recipientEmail}`
  };
}

module.exports = {
  sendInvitationEmail
};
