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

async function autoExpireRFQs() {
  try {
    const now = new Date();
    await (prisma as any).marketplaceRFQ.updateMany({
      where: {
        status: 'OPEN',
        expiresAt: { lt: now }
      },
      data: {
        status: 'EXPIRED'
      }
    });
  } catch (e) {
    console.error('Failed to auto-expire RFQs in API:', e);
  }
}

// GET active RFQ opportunities
export async function GET(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    await autoExpireRFQs();

    const rfqs = await (prisma as any).marketplaceRFQ.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      include: {
        store: {
          select: { name: true, city: true }
        },
        quotes: {
          where: { vendorId: vendorContext.vendorId }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: rfqs.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        quantity: Number(r.quantity),
        budget: r.budget ? Number(r.budget) : null,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        store: r.store,
        hasSubmittedQuote: r.quotes.length > 0,
        myQuote: r.quotes.length > 0 ? {
          id: r.quotes[0].id,
          price: Number(r.quotes[0].price),
          notes: r.quotes[0].notes,
          createdAt: r.quotes[0].createdAt
        } : null
      }))
    });
  } catch (error: any) {
    console.error('Vendor API GET RFQ Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST submit a quote to an RFQ
export async function POST(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { rfqId, price, notes } = body;

    if (!rfqId || !price) {
      return NextResponse.json({ success: false, error: 'rfqId et prix requis' }, { status: 400 });
    }

    // Check if duplicate quote exists
    const existing = await (prisma as any).marketplaceQuote.findFirst({
      where: {
        rfqId,
        vendorId: vendorContext.vendorId
      }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Vous avez déjà envoyé une proposition pour cette demande.' }, { status: 400 });
    }

    // Submit quote
    const quote = await (prisma as any).marketplaceQuote.create({
      data: {
        rfqId,
        vendorId: vendorContext.vendorId,
        price: Number(price),
        notes: notes || null
      }
    });

    // Notify buyer store owner
    const rfq = await (prisma as any).marketplaceRFQ.findUnique({
      where: { id: rfqId },
      include: { store: { include: { owner: true } } }
    });

    if (rfq?.store?.owner) {
      await (prisma as any).tradeNotification.create({
        data: {
          userId: rfq.store.owner.id,
          type: 'RFQ_QUOTE',
          title: 'Nouvelle proposition RFQ',
          content: `Un vendeur a soumis une proposition pour votre demande : ${rfq.title}`,
          metadata: { quoteId: quote.id }
        }
      });
    }

    return NextResponse.json({ success: true, data: quote });
  } catch (error: any) {
    console.error('Vendor API POST RFQ Quote Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
