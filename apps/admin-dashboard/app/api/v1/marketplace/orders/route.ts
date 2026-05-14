import { NextResponse } from 'next/server';
import { prisma } from '@coffeeshop/database';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'elkassa_super_secret_key_2026';

export async function POST(req: Request) {
  try {
    // 1. Authentification via JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Token invalide ou expiré' }, { status: 401 });
    }

    const storeId = decoded.storeId;
    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Seuls les acheteurs (Store) peuvent commander' }, { status: 403 });
    }

    // 2. Récupération du payload (Panier)
    const body = await req.json();
    const { items, deliveryAddress, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Le panier est vide' }, { status: 400 });
    }

    // 3. Traitement métier : Séparer les commandes par fournisseur
    const ordersByVendor = new Map();
    let totalGlobal = 0;

    for (const item of items) {
      const vendorId = item.vendor?.id;
      if (!vendorId) continue;

      if (!ordersByVendor.has(vendorId)) {
        ordersByVendor.set(vendorId, {
          storeId,
          vendorId,
          total: 0,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          items: []
        });
      }

      const orderData = ordersByVendor.get(vendorId);
      const lineTotal = item.price * item.quantity;
      orderData.total += lineTotal;
      totalGlobal += lineTotal;

      orderData.items.push({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: lineTotal
      });
    }

    // 4. Enregistrement transactionnel
    const createdOrders = [];
    for (const [vendorId, orderData] of ordersByVendor.entries()) {
      const order = await prisma.supplierOrder.create({
        data: {
          storeId: orderData.storeId,
          vendorId: orderData.vendorId,
          total: orderData.total,
          status: orderData.status,
          paymentStatus: orderData.paymentStatus,
          notes: notes,
          items: {
            create: orderData.items
          }
        },
        include: {
          items: true
        }
      });
      createdOrders.push(order);
    }

    return NextResponse.json({
      success: true,
      data: {
        ordersCount: createdOrders.length,
        totalGlobal,
        orders: createdOrders.map(o => ({
          id: o.id,
          vendorId: o.vendorId,
          total: o.total,
          status: o.status
        }))
      }
    });

  } catch (error) {
    console.error('Order API Error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la création de la commande' }, { status: 500 });
  }
}
