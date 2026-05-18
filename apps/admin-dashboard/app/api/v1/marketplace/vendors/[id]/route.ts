import { NextResponse } from 'next/server';
import { prisma } from '@coffeeshop/database';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'elkassa_super_secret_key_2026';

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET Vendor profile with progressive Vault masking rules
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userContext = await authenticateUser(req);
  if (!userContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const vendorId = params.id;
  const storeId = userContext.storeId;

  try {
    // 1. Fetch vendor profile
    const vendor = await (prisma as any).vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        mktSectors: { select: { name: true } }
      }
    });

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Profil vendeur introuvable' }, { status: 404 });
    }

    let vaultLevel: 1 | 2 | 3 = 1; // Default
    const isPremium = !!vendor.isPremium;

    // 2. Check if order is confirmed (Level 3)
    if (storeId) {
      const confirmedOrder = await prisma.supplierOrder.findFirst({
        where: {
          storeId: storeId,
          vendorId: vendorId,
          status: 'CONFIRMED'
        }
      });
      if (confirmedOrder) {
        vaultLevel = 3;
      } else {
        // Option to check if in cart (passed as query param or local storage sync)
        const { searchParams } = new URL(req.url);
        const isInCart = searchParams.get('isInCart') === 'true';
        if (isInCart) {
          vaultLevel = 2;
        }
      }
    }

    const identityVisible = vaultLevel >= 3 || isPremium;

    // 3. Apply Supplier Vault masking rules
    const payload = {
      id: vendor.id,
      companyName: identityVisible ? vendor.companyName : "Fournisseur Vérifié",
      description: vendor.description,
      status: vendor.status,
      isPremium,
      vaultLevel,
      sectors: vendor.mktSectors.map((s: any) => s.name),
      isEcoResponsible: !!vendor.isEcoResponsible,
      
      // Masked fields
      city: identityVisible ? (vendor.city || 'Tunisie') : 'Ville masquée',
      governorate: identityVisible ? vendor.governorate : 'Gouvernorat masqué',
      address: identityVisible ? vendor.address : 'Adresse masquée pour des raisons de sécurité B2B',
      phone: identityVisible ? vendor.phone : 'Numéro de téléphone sécurisé',
      lat: identityVisible ? vendor.lat : null,
      lng: identityVisible ? vendor.lng : null
    };

    return NextResponse.json({
      success: true,
      data: payload
    });

  } catch (error: any) {
    console.error('Vendor Profile API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
