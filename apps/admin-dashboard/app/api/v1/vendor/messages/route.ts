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

// GET all messages or direct conversation messages
export async function GET(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get('otherUserId');
  const userId = vendorContext.userId;

  try {
    if (otherUserId) {
      // Return direct message history
      const messages = await (prisma as any).tradeMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId }
          ]
        },
        orderBy: { createdAt: 'asc' },
        include: {
          product: { select: { id: true, name: true, image: true } }
        }
      });

      return NextResponse.json({ success: true, data: messages });
    }

    // Default: Return grouped chat threads
    const messages = await (prisma as any).tradeMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            vendorProfile: { select: { id: true, isPremium: true } }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
            vendorProfile: { select: { id: true, isPremium: true } }
          }
        },
        product: { select: { id: true, name: true, image: true } }
      }
    });

    const conversationsMap = new Map<string, any>();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!otherUser) continue;

      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          otherUser,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            senderId: msg.senderId
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: Array.from(conversationsMap.values())
    });

  } catch (error: any) {
    console.error('Vendor API GET Messages Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST send a message
export async function POST(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { receiverId, content, productId } = body;
    const userId = vendorContext.userId;

    if (!receiverId || !content) {
      return NextResponse.json({ success: false, error: 'Interlocuteur et contenu requis' }, { status: 400 });
    }

    // Apply spam / phone number filter
    let filteredContent = content;
    const phoneRegex = /(?:\+?216)?[-.\s]?\d{2}[-.\s]?\d{3}[-.\s]?\d{3}/;
    if (phoneRegex.test(content)) {
      filteredContent = "[MESSAGE FILTRÉ : Coordonnées détectées]";
    }

    const message = await (prisma as any).tradeMessage.create({
      data: {
        senderId: userId,
        receiverId,
        productId: productId || null,
        content: filteredContent
      }
    });

    // Notify receiver
    await (prisma as any).tradeNotification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        title: 'Nouveau message',
        content: `Vous avez reçu un message de ${vendorContext.email}.`,
        metadata: { messageId: message.id }
      }
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    console.error('Vendor API POST Message Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
