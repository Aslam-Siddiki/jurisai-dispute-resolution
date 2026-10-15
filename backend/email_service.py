import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import urllib.parse

def generate_email_content(party_a_name: str, party_b_name: str, dispute_title: str, invite_url: str, party_b_email: str = ""):
    subject = f"Action Requested: Mediation Invitation from {party_a_name} regarding '{dispute_title}'"
    
    plain_text = f"""Hello {party_b_name},

{party_a_name} has registered a civil dispute case on JurisAI: "{dispute_title}".

You have been invited as Party B to participate in AI-assisted conflict resolution and mediation.

Please review the claim and submit your response statement and any supporting evidence by visiting the following link:
{invite_url}

JurisAI uses Natural Language Processing to analyze statements from both parties objectively and recommend balanced, legally grounded settlements.

Best regards,
JurisAI Mediation Platform
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mediation Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); border-bottom: 1px solid #334155;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #60a5fa; letter-spacing: -0.5px;">⚖️ JurisAI</span>
                    <span style="font-size: 13px; color: #94a3b8; margin-left: 8px;">Civil Mediation System</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; color: #f8fafc; font-size: 20px; font-weight: 700;">
                You've Been Invited to Resolve a Dispute
              </h2>
              <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                Hello <strong>{party_b_name}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                <strong>{party_a_name}</strong> has submitted a dispute matter entitled:
              </p>

              <!-- Dispute Box -->
              <div style="background-color: #0f172a; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px 20px; margin: 0 0 24px 0;">
                <div style="font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 4px;">Dispute Case</div>
                <div style="font-size: 17px; font-weight: 600; color: #ffffff;">{dispute_title}</div>
              </div>

              <p style="margin: 0 0 24px 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                JurisAI provides a neutral, AI-assisted conflict resolution platform. Both parties provide their respective accounts and evidence, which our multi-stage NLP pipeline evaluates to propose a fair, objective settlement.
              </p>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{invite_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
                      Review Claim &amp; Respond &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                Or copy and paste this link in your browser:<br>
                <a href="{invite_url}" style="color: #60a5fa; word-break: break-all;">{invite_url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                JurisAI Online Dispute Resolution &bull; AI-Powered Settlement Mediation<br>
                This automated invitation was generated upon formal dispute registration.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    # Generate mailto link
    mailto_params = urllib.parse.urlencode({
        "subject": subject,
        "body": plain_text
    })
    mailto_link = f"mailto:{party_b_email}?{mailto_params}"

    # Generate direct Gmail web compose link
    gmail_params = urllib.parse.urlencode({
        "view": "cm",
        "fs": "1",
        "to": party_b_email,
        "su": subject,
        "body": plain_text
    })
    gmail_link = f"https://mail.google.com/mail/?{gmail_params}"

    return {
        "subject": subject,
        "plain_text": plain_text,
        "html_content": html_content,
        "mailto_link": mailto_link,
        "gmail_link": gmail_link
    }

def send_invitation_email(
    party_b_email: str,
    party_b_name: str,
    party_a_name: str,
    dispute_title: str,
    invite_url: str
) -> dict:
    """
    Sends an invitation email using SMTP if configured,
    or falls back to simulated email with full content preview.
    """
    email_data = generate_email_content(party_a_name, party_b_name, dispute_title, invite_url, party_b_email)
    
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SMTP_FROM", smtp_user or "notifications@jurisai.local")

    if smtp_host and smtp_user and smtp_password and party_b_email:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = email_data["subject"]
            msg["From"] = sender_email
            msg["To"] = party_b_email

            part1 = MIMEText(email_data["plain_text"], "plain")
            part2 = MIMEText(email_data["html_content"], "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(sender_email, [party_b_email], msg.as_string())

            return {
                "success": True,
                "mode": "smtp",
                "recipient": party_b_email,
                "subject": email_data["subject"],
                "invite_url": invite_url,
                "mailto_link": email_data["mailto_link"],
                "gmail_link": email_data["gmail_link"],
                "message": f"Invitation email successfully sent via SMTP to {party_b_email}"
            }
        except Exception as e:
            print(f"[EMAIL SERVICE WARNING] SMTP failed: {e}. Falling back to simulation mode.")
            return {
                "success": True,
                "mode": "simulated",
                "recipient": party_b_email,
                "subject": email_data["subject"],
                "invite_url": invite_url,
                "mailto_link": email_data["mailto_link"],
                "gmail_link": email_data["gmail_link"],
                "email_preview": email_data["plain_text"],
                "message": f"Simulated invitation email prepared for {party_b_email} (SMTP error: {str(e)})"
            }

    # Simulation mode (default for local dev)
    print(f"[EMAIL SERVICE] Simulated email invitation for {party_b_name} ({party_b_email}) at {invite_url}")
    return {
        "success": True,
        "mode": "simulated",
        "recipient": party_b_email,
        "subject": email_data["subject"],
        "invite_url": invite_url,
        "mailto_link": email_data["mailto_link"],
        "gmail_link": email_data["gmail_link"],
        "email_preview": email_data["plain_text"],
        "message": f"Invitation email prepared and link generated for {party_b_email}"
    }
