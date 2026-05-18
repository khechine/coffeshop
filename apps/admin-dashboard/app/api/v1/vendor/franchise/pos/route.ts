import { NextResponse } from 'next/server';
import { prisma } from '@coffeeshop/database';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'elkassa_super_secret_key_2026';

async function authenticateVendor(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded.vendorId) return null;
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET all POS/franchise locations and their stocks
export async function GET(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const posLocations = await (prisma as any).vendorPos.findMany({
      where: { vendorId: vendorContext.vendorId },
      include: {
        stockItems: {
          include: {
            vendorProduct: {
              select: { id: true, name: true, unit: true, price: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: posLocations.map((pos: any) => ({
        id: pos.id,
        name: pos.name,
        address: pos.address,
        city: pos.city,
        phone: pos.phone,
        lat: pos.lat,
        lng: pos.lng,
        isActive: pos.isActive,
        createdAt: pos.createdAt,
        stocks: pos.stockItems.map((s: any) => ({
          id: s.id,
          productId: s.vendorProductId,
          productName: s.vendorProduct?.name || 'Produit inconnu',
          unit: s.vendorProduct?.unit || 'unité',
          price: s.vendorProduct?.price ? Number(s.vendorProduct.price) : 0,
          quantity: Number(s.quantity)
        }))
      }))
    });
  } catch (error: any) {
    console.error('Franchise POS GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create a new POS/franchise location
export async function POST(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, address, city, phone, lat, lng } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Le nom du point de vente est requis' }, { status: 400 });
    }

    const pos = await (prisma as any).vendorPos.create({
      data: {
        name,
        address: address || null,
        city: city || null,
        phone: phone || null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        vendorId: vendorContext.vendorId
      }
    });

    return NextResponse.json({ success: true, data: pos });
  } catch (error: any) {
    console.error('Franchise POS POST API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT to update a POS details or stock quantity
export async function PUT(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { posId, name, address, city, phone, lat, lng, isActive, stockUpdates } = body;

    if (!posId) {
      return NextResponse.json({ success: false, error: 'posId requis' }, { status: 400 });
    }

    // Verify vendor owns this POS
    const existingPos = await (prisma as any).vendorPos.findUnique({ where: { id: posId } });
    if (!existingPos || existingPos.vendorId !== vendorContext.vendorId) {
      return NextResponse.json({ success: false, error: 'Point de vente non trouvé ou non autorisé' }, { status: 404 });
    }

    // 1. Handle stock updates if present
    if (Array.isArray(stockUpdates)) {
      for (const update of stockUpdates) {
        const { productId, quantity } = update;
        if (!productId || quantity === undefined) continue;

        // Verify product belongs to this vendor
        const prod = await prisma.vendorProduct.findUnique({ where: { id: productId } });
        if (!prod || prod.vendorId !== vendorContext.vendorId) continue;

        // Upsert POS stock
        await (prisma as any).vendorPosStock.upsert({
          where: {
            vendorPosId_vendorProductId: {
              vendorPosId: posId,
              vendorProductId: productId
            }
          },
          update: {
            quantity: Number(quantity)
          },
          create: {
            vendorPosId: posId,
            vendorProductId: productId,
            quantity: Number(quantity)
          }
        });
      }
    }

    // 2. Handle metadata updates
    const updatedPos = await (prisma as any).vendorPos.update({
      where: { id: posId },
      data: {
        name: name || undefined,
        address: address !== undefined ? address : undefined,
        city: city !== undefined ? city : undefined,
        phone: phone !== undefined ? phone : undefined,
        lat: lat !== undefined ? Number(lat) : undefined,
        lng: lng !== undefined ? Number(lng) : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined
      }
    });

    return NextResponse.json({ success: true, data: updatedPos });
  } catch (error: any) {
    console.error('Franchise POS PUT API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
