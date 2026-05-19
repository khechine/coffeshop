import { NextResponse } from 'next/server';
import { sendMarketplaceEmail } from '../../lib/mail';

export async function POST(request: Request) {
  try {
    const { name, phone, company, email } = await request.json();

    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Name, email, and phone are required' }, { status: 400 });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #E31E24;">Nouvelle demande de contact B2B</h2>
        <p>Un visiteur a soumis le formulaire "Parler à un expert" sur la page d'accueil d'ElKassa.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #E31E24;">
          <strong>Détails du prospect :</strong><br><br>
          • <strong>Nom :</strong> ${name}<br>
          • <strong>E-mail :</strong> ${email}<br>
          • <strong>Téléphone :</strong> ${phone}<br>
          • <strong>Entreprise :</strong> ${company || 'Non renseigné'}<br>
        </div>
        
        <p>Veuillez contacter ce prospect dans les plus brefs délais pour planifier une démonstration.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">
          Message généré automatiquement par ElKassa B2B.
        </p>
      </div>
    `;

    await sendMarketplaceEmail({
      to: 'contact@elkassa.com',
      subject: `[ElKassa B2B] Nouvelle demande de contact de ${name}`,
      text: `Nom: ${name}\nTéléphone: ${phone}\nEntreprise: ${company || 'Non renseigné'}`,
      html: htmlContent
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to send contact email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
