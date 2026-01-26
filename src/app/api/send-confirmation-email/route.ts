import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// SMTP Configuration from environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'w018c883.kasserver.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'm07c2db3',
    pass: process.env.SMTP_PASSWORD || 'SDSZAe4kik4fAfAKZ7nD',
  },
};

const FROM_EMAIL = process.env.EMAIL_FROM || 'hilfe@hauswunsch24.de';

interface ConfirmationEmailData {
  email: string;
  vorname: string;
  nachname: string;
  tcNummer: string;
  trackingToken?: string;
  trackingUrl?: string;
}

function createConfirmationEmailHTML(data: ConfirmationEmailData): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ihre Gewährleistungsmeldung</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #E30613 0%, #C00510 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .welcome-text {
      font-size: 16px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #E30613;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box h3 {
      margin: 0 0 15px 0;
      color: #E30613;
      font-size: 16px;
    }
    .credential-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .credential-item:last-child {
      border-bottom: none;
    }
    .credential-label {
      font-weight: 600;
      color: #4b5563;
    }
    .credential-value {
      color: #1f2937;
      font-family: monospace;
      font-size: 14px;
    }
    .button-container {
      text-align: center;
      margin: 25px 0;
    }
    .login-button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #E30613;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: background-color 0.2s;
    }
    .login-button:hover {
      background-color: #C00510;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ihre Gewährleistungsmeldung</h1>
      <p>TC-Nummer: ${data.tcNummer}</p>
    </div>

    <div class="content">
      <p class="welcome-text">
        Hallo ${data.vorname} ${data.nachname},
      </p>
      <p class="welcome-text">
        vielen Dank für Ihre Meldung. Wir haben Ihre Gewährleistungsmeldung
        erfolgreich erhalten und werden diese umgehend bearbeiten.
      </p>

      <div class="info-box">
        <h3>Status verfolgen</h3>
        <p style="margin: 0; color: #4b5563;">
          Sie können den Bearbeitungsstatus Ihrer Meldung jederzeit online verfolgen.
        </p>
      </div>

      ${data.trackingUrl ? `
      <div class="info-box" style="background-color: #f0fdf4; border-left-color: #16a34a;">
        <h3 style="color: #16a34a; margin: 0 0 15px 0;">Ihr persönlicher Direktlink</h3>
        <p style="margin: 0 0 15px 0; color: #4b5563;">
          Verfolgen Sie den Status Ihrer Meldung über diesen sicheren Direktlink –
          ähnlich wie eine Sendungsverfolgung:
        </p>
        <div class="button-container">
          <a href="${data.trackingUrl}" class="login-button" style="background-color: #16a34a; hover:bg-color: #15803d;">
            Zum Status verfolgen
          </a>
        </div>
        <p style="font-size: 12px; color: #6b7280; margin: 15px 0 0 0;">
          <strong>Sicherheit:</strong> Zur Verifikation benötigen Sie Ihre Postleitzahl
          und E-Mail-Adresse. So sind Ihre Daten geschützt, auch wenn jemand anderes
          auf den Link zugreift.
        </p>
      </div>
      ` : ''}

      <div class="info-box" style="background-color: #eff6ff; border-left-color: #2563eb;">
        <h3 style="color: #2563eb; margin: 0 0 15px 0;">Kunden-Login</h3>
        <p style="margin: 0 0 15px 0; color: #4b5563;">
          Melden Sie sich auf <a href="https://www.tc.scalesite.de/customer-login" style="color: #2563eb; font-weight: 600;">www.tc.scalesite.de</a>
          mit Ihren Zugangsdaten an:
        </p>
        <div class="credential-item" style="border-bottom: none; padding: 8px 0;">
          <span class="credential-label">E-Mail:</span>
          <span class="credential-value">${data.email}</span>
        </div>
        <div class="credential-item" style="border-bottom: none; padding: 8px 0;">
          <span class="credential-label">TC-Nummer:</span>
          <span class="credential-value">${data.tcNummer}</span>
        </div>
        <p style="font-size: 12px; color: #6b7280; margin: 15px 0 0 0;">
          <strong>Kein Passwort erforderlich</strong> – nur E-Mail und TC-Nummer.
        </p>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        Bei Fragen erreichen Sie uns unter <a href="mailto:hilfe@hauswunsch24.de">hilfe@hauswunsch24.de</a>
      </p>
    </div>

    <div class="footer">
      <p>Diese E-Mail wurde automatisch vom TC-Gewährleistungssystem generiert.</p>
      <p>TC Gewährleistung - Ein Service von hauswunsch24</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Confirmation Email API] Received request');

    const body = await request.json() as ConfirmationEmailData;

    // Validate required fields
    if (!body.email || !body.vorname || !body.nachname || !body.tcNummer) {
      console.error('[Confirmation Email API] Missing required fields');
      return NextResponse.json(
        { error: 'Fehlende erforderliche Felder' },
        { status: 400 }
      );
    }

    console.log('[Confirmation Email API] Creating SMTP transporter');

    // Create transporter
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    // Verify SMTP connection
    console.log('[Confirmation Email API] Verifying SMTP connection...');
    try {
      await transporter.verify();
      console.log('[Confirmation Email API] SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('[Confirmation Email API] SMTP verification failed:', verifyError);
      throw new Error(`SMTP-Verbindung fehlgeschlagen: ${verifyError instanceof Error ? verifyError.message : 'Unbekannter Fehler'}`);
    }

    // Create email HTML
    const htmlContent = createConfirmationEmailHTML(body);

    // Email options
    const mailOptions = {
      from: `TC Gewährleistung <${FROM_EMAIL}>`,
      to: body.email,
      subject: `Ihre Gewährleistungsmeldung - ${body.tcNummer}`,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'TC Warranty System',
      },
    };

    console.log('[Confirmation Email API] Sending email...', {
      from: FROM_EMAIL,
      to: body.email,
      subject: mailOptions.subject,
    });

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('[Confirmation Email API] Email sent successfully', {
      messageId: info.messageId,
      response: info.response,
    });

    return NextResponse.json(
      {
        success: true,
        messageId: info.messageId,
        message: 'Bestätigungs-E-Mail erfolgreich versendet'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Confirmation Email API] Error sending email:', error);

    if (error instanceof Error) {
      console.error('[Confirmation Email API] Error name:', error.name);
      console.error('[Confirmation Email API] Error message:', error.message);
    }

    return NextResponse.json(
      {
        error: 'Fehler beim Versenden der Bestätigungs-E-Mail',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}
