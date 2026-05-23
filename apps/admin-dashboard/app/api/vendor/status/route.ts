import { NextResponse } from 'next/server';
import { prisma } from '@coffeeshop/database';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ notifications: [], profile: null }, { status: 401 });
    }

    const [notifs, profile] = await Promise.all([
      (prisma as any).tradeNotification.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      (prisma as any).vendorProfile.findUnique({
        where: { userId },
        select: { id: true }
      })
    ]);

    return NextResponse.json({ notifications: notifs, profile });
  } catch (error) {
    console.error('API /api/vendor/status error:', error);
    return NextResponse.json({ notifications: [], profile: null }, { status: 500 });
  }
}
