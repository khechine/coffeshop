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

// GET decrypted/fully-visible buyer/client contact details after order validation
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const orderId = params.id;

  try {
    // 1. Fetch order and include buyer's store and owners
    const order: any = await prisma.supplierOrder.findUnique({
      where: { id: orderId },
      include: {
        store: {
          include: {
            owners: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });
    }

    // Verify vendor owns this order
    if (order.vendorId !== vendorContext.vendorId) {
      return NextResponse.json({ success: false, error: 'Accès interdit à cette commande' }, { status: 403 });
    }

    // 2. Progressive Reveal Check: Identity is only revealed if status is CONFIRMED, SHIPPED, DELIVERED or PAID
    const isValid = ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'PAID'].includes(order.status);

    const mainOwner = order.store?.owners?.[0];

    if (!isValid) {
      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          status: order.status,
          contactUnlocked: false,
          clientName: `Cafétéria #${order.storeId.slice(-4).toUpperCase()}`,
          city: order.store?.city || 'Tunisie (Ville masquée)',
          address: 'Adresse masquée. Validez la commande pour déverrouiller les coordonnées de livraison.',
          phone: 'Téléphone masqué',
          email: 'Email masqué',
          ownerName: 'Acheteur masqué'
        }
      });
    }

    // 3. Fully revealed contact details
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        contactUnlocked: true,
        clientName: order.store?.name,
        city: order.store?.city,
        address: order.store?.address,
        phone: order.store?.phone || mainOwner?.phone || 'Non renseigné',
        email: mainOwner?.email || 'Non renseigné',
        ownerName: mainOwner?.name || 'Non renseigné'
      }
    });

  } catch (error: any) {
    console.error('Client Contact Reveal API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
