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
  const from = "ElKassa Marketplace <marketplace@elkassa.com>";

  console.log(`
    [EMAIL DISPATCH]
    FROM: ${from}
    TO: ${to}
    SUBJECT: ${subject}
    CONTENT: ${text}
    --------------------------------------------------
  `);

  // INTEGRATION NOTE: 
  // To enable real emails, install nodemailer or resend and configure SMTP here.
  /*
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({ from, to, subject, text, html });
  */

  return { success: true };
}
