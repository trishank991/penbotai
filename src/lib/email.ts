import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'PenBotAI <noreply@penbotai.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://penbotai.com';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
    console.log('Email not sent (no API key configured):', { to, subject });
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ==================== Email Templates ====================

export async function sendWelcomeEmail(email: string, name?: string) {
  const displayName = name || 'there';

  return sendEmail({
    to: email,
    subject: 'Welcome to PenBotAI!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PenBotAI!</h1>
    </div>

    <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">
        Hi ${displayName},
      </p>

      <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">
        Thanks for joining PenBotAI! We're excited to help you use AI tools ethically and effectively in your academic work.
      </p>

      <p style="font-size: 16px; color: #334155; margin-bottom: 16px;">
        Here's what you can do with PenBotAI:
      </p>

      <ul style="color: #334155; font-size: 15px; line-height: 1.8; padding-left: 20px;">
        <li><strong>Research Assistant</strong> - Search 200M+ academic papers instantly</li>
        <li><strong>AI Disclosure Generator</strong> - Create ethical AI use statements</li>
        <li><strong>Prompt Coach</strong> - Learn to write better AI prompts</li>
        <li><strong>Grammar Checker</strong> - Polish your writing</li>
        <li><strong>Plagiarism Detection</strong> - Ensure originality</li>
      </ul>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Go to Dashboard
        </a>
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
        Have questions? Just reply to this email - we're here to help!
      </p>

      <p style="font-size: 14px; color: #64748b;">
        Happy learning,<br>
        The PenBotAI Team
      </p>
    </div>

    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">PenBotAI - Ethical AI Tools for Students</p>
      <p style="margin: 8px 0 0 0;">
        <a href="${APP_URL}" style="color: #64748b;">Visit Website</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
  });
}

export async function sendDisclosureEmail(
  email: string,
  disclosure: string,
  assignmentType: string
) {
  return sendEmail({
    to: email,
    subject: `Your AI Disclosure Statement - ${assignmentType}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 24px 32px; border-radius: 12px 12px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 22px;">Your AI Disclosure Statement</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
        Assignment: ${assignmentType}
      </p>
    </div>

    <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">
        Here's your generated AI disclosure statement. You can copy and paste this into your assignment.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="font-size: 14px; color: #334155; line-height: 1.7; margin: 0; white-space: pre-wrap;">${disclosure}</p>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${APP_URL}/disclosure" style="display: inline-block; background: #f1f5f9; color: #3b82f6; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">
          Generate Another Disclosure
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

      <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
        <strong>Tips for using AI disclosures:</strong>
      </p>
      <ul style="font-size: 13px; color: #64748b; line-height: 1.8; padding-left: 20px; margin-top: 8px;">
        <li>Place the disclosure at the end of your document or in an appendix</li>
        <li>Always follow your institution's specific AI use policies</li>
        <li>Update the disclosure if you make additional changes using AI</li>
      </ul>
    </div>

    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">Generated by PenBotAI</p>
      <p style="margin: 8px 0 0 0;">
        <a href="${APP_URL}" style="color: #64748b;">penbotai.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  return sendEmail({
    to: email,
    subject: 'Reset your PenBotAI password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
    </div>

    <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">
        We received a request to reset your password. Click the button below to create a new password.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Reset Password
        </a>
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>

      <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
        This link will expire in 24 hours.
      </p>
    </div>

    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">PenBotAI - Ethical AI Tools for Students</p>
    </div>
  </div>
</body>
</html>
    `,
  });
}

export async function sendTeamInviteEmail(
  email: string,
  teamName: string,
  inviterName: string,
  inviteUrl: string
) {
  return sendEmail({
    to: email,
    subject: `You've been invited to join ${teamName} on PenBotAI`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Team Invitation</h1>
    </div>

    <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">
        <strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> on PenBotAI.
      </p>

      <p style="font-size: 15px; color: #64748b; margin-bottom: 24px;">
        As a team member, you'll get access to shared resources, collaborative features, and premium tools.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Accept Invitation
        </a>
      </div>

      <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
        This invitation will expire in 7 days.
      </p>
    </div>

    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">PenBotAI - Ethical AI Tools for Students</p>
    </div>
  </div>
</body>
</html>
    `,
  });
}
