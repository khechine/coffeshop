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

// GET Vault statuses for a buyer's store
export async function GET(req: Request) {
  const userContext = await authenticateUser(req);
  if (!userContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const storeId = userContext.storeId;
  if (!storeId) {
    return NextResponse.json({ success: false, error: 'Aucun magasin acheteur associé à cet utilisateur' }, { status: 400 });
  }

  try {
    // 1. Get confirmed orders' vendor IDs (Level 3)
    const confirmedOrders = await prisma.supplierOrder.findMany({
      where: {
        storeId: storeId,
        status: 'CONFIRMED'
      },
      select: { vendorId: true }
    });
    const confirmedVendorIds = Array.from(
      new Set(confirmedOrders.map((o: any) => o.vendorId))
    ).filter(Boolean) as string[];

    // 2. Get active cart items' vendor IDs (Level 2)
    // Query the buyer's store cart (usually stored in cart table or stockItems depending on B2B schema)
    // For mobile client convenience, they can also pass a list of cart vendorIds to calculate levels.
    const { searchParams } = new URL(req.url);
    const cartVendorIdsParam = searchParams.get('cartVendorIds');
    const cartVendorIds = cartVendorIdsParam ? cartVendorIdsParam.split(',') : [];

    // 3. Retrieve all vendors to determine their premium status
    const vendors = await (prisma as any).vendorProfile.findMany({
      select: { id: true, companyName: true, isPremium: true, city: true }
    });

    const vaultLevels = vendors.map((vendor: any) => {
      let level = 1; // Default: Stade 1 (Login requis)
      
      if (confirmedVendorIds.includes(vendor.id)) {
        level = 3; // Stade 3 (Commande confirmée)
      } else if (cartVendorIds.includes(vendor.id)) {
        level = 2; // Stade 2 (Présent dans le panier)
      }

      const isPremium = !!vendor.isPremium;
      const identityVisible = level >= 3 || isPremium;

      return {
        vendorId: vendor.id,
        companyName: identityVisible ? vendor.companyName : `Fournisseur ${vendor.id.slice(-4).toUpperCase()}`,
        city: identityVisible ? (vendor.city || 'Tunisie') : 'Ville masquée',
        isPremium,
        vaultLevel: level,
        identityVisible,
        isContactVisible: level >= 3 || isPremium
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        storeId,
        vaultLevels
      }
    });

  } catch (error: any) {
    console.error('Vault Status API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
