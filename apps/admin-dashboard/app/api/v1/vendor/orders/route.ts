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

// GET all orders for the vendor
export async function GET(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const orders = await prisma.supplierOrder.findMany({
      where: { vendorId: vendorContext.vendorId },
      include: {
        store: {
          select: { id: true, name: true, city: true, address: true, phone: true }
        },
        items: {
          include: {
            stockItem: {
              select: { id: true, name: true, unit: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: orders.map((o: any) => ({
        id: o.id,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt,
        store: o.store,
        items: o.items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          productName: item.stockItem?.name || 'Produit'
        }))
      }))
    });
  } catch (error: any) {
    console.error('Vendor API GET Orders Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT to update an order's status
export async function PUT(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'Identifiant de commande et statut requis' }, { status: 400 });
    }

    // Verify ownership
    const order = await prisma.supplierOrder.findUnique({ where: { id: orderId } });
    if (!order || order.vendorId !== vendorContext.vendorId) {
      return NextResponse.json({ success: false, error: 'Commande non trouvée ou non autorisée' }, { status: 404 });
    }

    const updated = await prisma.supplierOrder.update({
      where: { id: orderId },
      data: {
        status: status as any
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        total: Number(updated.total)
      }
    });
  } catch (error: any) {
    console.error('Vendor API PUT Order Status Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
