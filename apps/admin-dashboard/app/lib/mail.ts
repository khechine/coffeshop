import nodemailer from 'nodemailer';

/**
 * ElKassa Marketplace Email Utility
 * This handles sending notifications to vendors and buyers.
 */

export async function sendMarketplaceEmail({ 
  to, 
  subject, 
  text, 
  html 
}: { 
  to: string; 
  subject: string; 
  text: string; 
  html?: string; 
}) {
  const from = "ElKassa <postmaster@elkassa.com>";

  console.log(`
    [EMAIL DISPATCH - SMTP RELAY]
    FROM: ${from}
    TO: ${to}
    SUBJECT: ${subject}
    CONTENT: ${text}
    --------------------------------------------------
  `);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.elkassa.com',
      port: Number(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports (587)
      auth: {
        user: process.env.SMTP_USER || 'postmaster@elkassa.com',
        pass: process.env.SMTP_PASS || 'se01Wh6IRDKBQXMX',
      },
      tls: {
        rejectUnauthorized: false // Avoid connection failures due to self-signed certs or SMTP relay cert name mismatches
      }
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>')
    });

    console.log(`[EMAIL DISPATCH SUCCESS] MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[EMAIL DISPATCH ERROR]', error);
    return { success: false, error: error.message };
  }
}
