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
const TO_EMAIL = process.env.EMAIL_TO || 'hilfe@hauswunsch24.de';

interface EmailData {
  timestamp: string;
  vorname: string;
  nachname: string;
  strasseHausnummer: string;
  plz: string;
  ort: string;
  tcNummer: string;
  email: string;
  telefon: string;
  beschreibung: string;
  fileNames: string[];
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createEmailHTML(data: EmailData): string {
  const formattedDate = formatTimestamp(data.timestamp);

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Gewährleistungsmeldung</title>
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
      max-width: 800px;
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
    .header p {
      margin: 10px 0 0 0;
      font-size: 14px;
      opacity: 0.95;
    }
    .content {
      padding: 30px;
    }
    .info-section {
      margin-bottom: 30px;
    }
    .info-section h2 {
      color: #E30613;
      font-size: 18px;
      margin: 0 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #E30613;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table tr {
      border-bottom: 1px solid #e5e7eb;
    }
    table tr:last-child {
      border-bottom: none;
    }
    table td {
      padding: 12px 8px;
      vertical-align: top;
    }
    table td:first-child {
      font-weight: 600;
      color: #4b5563;
      width: 180px;
    }
    table td:last-child {
      color: #1f2937;
    }
    .description-box {
      background-color: #f9fafb;
      border-left: 4px solid #E30613;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .files-list {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .files-list ul {
      margin: 0;
      padding-left: 20px;
    }
    .files-list li {
      padding: 5px 0;
      color: #4b5563;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .timestamp {
      background-color: #fef3c7;
      color: #92400e;
      padding: 10px 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      text-align: center;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Neue Gewährleistungsmeldung</h1>
      <p>TC-Nummer: ${data.tcNummer}</p>
    </div>

    <div class="content">
      <div class="timestamp">
        Eingangsdatum: ${formattedDate}
      </div>

      <div class="info-section">
        <h2>Kundendaten</h2>
        <table>
          <tr>
            <td>Name:</td>
            <td>${data.vorname} ${data.nachname}</td>
          </tr>
          <tr>
            <td>Adresse:</td>
            <td>${data.strasseHausnummer}<br>${data.plz} ${data.ort}</td>
          </tr>
          <tr>
            <td>E-Mail:</td>
            <td><a href="mailto:${data.email}" style="color: #E30613; text-decoration: none;">${data.email}</a></td>
          </tr>
          <tr>
            <td>Telefon:</td>
            <td><a href="tel:${data.telefon}" style="color: #E30613; text-decoration: none;">${data.telefon}</a></td>
          </tr>
        </table>
      </div>

      <div class="info-section">
        <h2>Problembeschreibung</h2>
        <div class="description-box">
          ${data.beschreibung.replace(/\n/g, '<br>')}
        </div>
      </div>

      ${data.fileNames.length > 0 ? `
      <div class="info-section">
        <h2>Hochgeladene Dateien</h2>
        <div class="files-list">
          <ul>
            ${data.fileNames.map(name => `<li>${name}</li>`).join('')}
          </ul>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 13px;">
            Die Dateien sind lokal im Admin-Dashboard verfügbar.
          </p>
        </div>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>Diese E-Mail wurde automatisch vom TC-Gewährleistungsformular generiert.</p>
      <p>Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Email API] Received request to send email');

    const body = await request.json() as EmailData;

    // Validate required fields
    if (!body.tcNummer || !body.email || !body.vorname || !body.nachname) {
      console.error('[Email API] Missing required fields', {
        tcNummer: !!body.tcNummer,
        email: !!body.email,
        vorname: !!body.vorname,
        nachname: !!body.nachname
      });
      return NextResponse.json(
        { error: 'Fehlende erforderliche Felder' },
        { status: 400 }
      );
    }

    console.log('[Email API] Creating SMTP transporter');

    // Create transporter
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    // Verify SMTP connection
    console.log('[Email API] Verifying SMTP connection...');
    try {
      await transporter.verify();
      console.log('[Email API] SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('[Email API] SMTP verification failed:', verifyError);
      throw new Error(`SMTP-Verbindung fehlgeschlagen: ${verifyError instanceof Error ? verifyError.message : 'Unbekannter Fehler'}`);
    }

    // Create email HTML
    const htmlContent = createEmailHTML(body);

    // Email options
    const mailOptions = {
      from: `TC Gewährleistung <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      replyTo: body.email,
      subject: `Neue Gewährleistungsmeldung - ${body.tcNummer}`,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'TC Warranty System',
      },
    };

    console.log('[Email API] Sending email...', {
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: mailOptions.subject,
    });

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('[Email API] Email sent successfully', {
      messageId: info.messageId,
      response: info.response,
    });

    return NextResponse.json(
      {
        success: true,
        messageId: info.messageId,
        message: 'E-Mail erfolgreich versendet'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Email API] Error sending email:', error);

    // Detailed error logging
    if (error instanceof Error) {
      console.error('[Email API] Error name:', error.name);
      console.error('[Email API] Error message:', error.message);
      console.error('[Email API] Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Fehler beim Versenden der E-Mail',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}
