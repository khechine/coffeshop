import { prisma } from '@coffeeshop/database';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type');
  if (type === 'categories') {
    const data = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(data);
  }
  if (type === 'marketplace') {
    const data = await prisma.mktCategory.findMany({ 
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' } 
    });
    return NextResponse.json(data);
  }
  if (type === 'poles') {
    const data = await prisma.activityPole.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(data);
  }
  return NextResponse.json([]);
}
