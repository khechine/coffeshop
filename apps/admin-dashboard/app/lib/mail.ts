import nodemailer from 'nodemailer';
import { prisma } from '@coffeeshop/database';

/**
 * ElKassa Marketplace Email Utility
 * This handles sending notifications to vendors and buyers.
 */

export async function getSmtpConfig() {
  try {
    const settings = await (prisma as any).systemSettings.findUnique({
      where: { id: 'global' }
    });
    if (settings && settings.smtpHost) {
      return {
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        user: settings.smtpUser,
        pass: settings.smtpPass,
        from: settings.smtpFrom || "ElKassa <postmaster@elkassa.com>"
      };
    }
  } catch (err) {
    console.error("Error fetching SMTP config from DB", err);
  }
  return {
    host: process.env.SMTP_HOST || 'mail.elkassa.com',
    port: Number(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || 'postmaster@elkassa.com',
    pass: process.env.SMTP_PASS || 'se01Wh6IRDKBQXMX',
    from: "ElKassa <postmaster@elkassa.com>"
  };
}

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
  const smtpConfig = await getSmtpConfig();
  const from = smtpConfig.from;

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
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465, // true for 465, false for other ports (587)
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
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
    
    // Log in DB
    try {
      await (prisma as any).emailLog.create({
        data: {
          to,
          subject,
          status: 'SENT',
          messageId: info.messageId
        }
      });
    } catch (dbErr) {
      console.error("Failed to log email to DB", dbErr);
    }

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[EMAIL DISPATCH ERROR]', error);
    
    // Log failure in DB
    try {
      await (prisma as any).emailLog.create({
        data: {
          to,
          subject,
          status: 'FAILED',
          error: error.message
        }
      });
    } catch (dbErr) {
      console.error("Failed to log email failure to DB", dbErr);
    }

    return { success: false, error: error.message };
  }
}

export async function sendWelcomeEmail({
  to,
  name,
  token,
  role,
  businessName
}: {
  to: string;
  name: string;
  token: string;
  role: 'STORE_OWNER' | 'VENDOR';
  businessName: string;
}) {
  const isVendor = role === 'VENDOR';
  const portalName = isVendor ? 'Espace Fournisseur' : 'Espace Client (Café / Pâtisserie)';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const verificationLink = `${appUrl}/verify-email?token=${token}`;

  const subject = `Bienvenue chez Alkassa - Validez votre adresse email`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; padding: 40px 20px; color: #1E293B;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%); padding: 32px; text-align: center; color: #ffffff;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px;">Alkassa</div>
          <div style="font-size: 14px; font-weight: 600; color: #818CF8; text-transform: uppercase; letter-spacing: 1px;">Plateforme B2B</div>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 32px;">
          <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin-top: 0; margin-bottom: 16px;">
            Bonjour ${name},
          </h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Nous sommes ravis de vous accueillir sur Alkassa en tant que <strong>${portalName}</strong> pour votre entreprise <strong>${businessName}</strong>.
          </p>
          
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 32px;">
            Pour commencer à utiliser toutes les fonctionnalités de votre compte en toute sécurité, veuillez vérifier votre adresse email en saisissant le code ci-dessous ou en cliquant sur le bouton de validation.
          </p>
          
          <!-- Code Block -->
          <div style="background-color: #F1F5F9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; border: 1px dashed #CBD5E1;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748B; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Votre code de validation</span>
            <span style="font-family: monospace; font-size: 32px; font-weight: 800; color: #1E1B4B; letter-spacing: 4px;">${token}</span>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${verificationLink}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25); transition: background-color 0.2s;">
              Valider mon adresse email
            </a>
          </div>
          
          <p style="font-size: 13px; line-height: 1.6; color: #64748B; margin-bottom: 0;">
            Si le bouton ci-dessus ne fonctionne pas, vous pouvez également copier et coller le lien suivant dans votre navigateur :<br>
            <a href="${verificationLink}" style="color: #4F46E5; word-break: break-all;">${verificationLink}</a>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #F8FAFC; border-top: 1px solid #F1F5F9; padding: 24px 32px; text-align: center; font-size: 12px; color: #94A3B8;">
          <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} Alkassa. Tous droits réservés.</p>
          <p style="margin: 0;">Si vous n'avez pas créé de compte sur notre plateforme, vous pouvez ignorer cet email.</p>
        </div>
      </div>
    </div>
  `;

  const text = `Bonjour ${name},\n\nBienvenue chez Alkassa en tant que ${portalName} pour ${businessName}.\n\nPour valider votre adresse email, utilisez le code suivant : ${token}\n\nOu cliquez sur ce lien : ${verificationLink}\n\nMerci,\nL'équipe Alkassa`;

  return sendMarketplaceEmail({ to, subject, text, html });
}
